-- ============================================================================
-- Migration 0023: تحسين توليد الـ Slugs العربية والدلالية للصنايعية الجدد
-- المرحلة 99: دعم الروابط العربية الدلالية في approve_craftsman_application
-- وتوسيع increment_craftsman_stats لقبول الروابط بالحروف العربية
-- ============================================================================

-- 1) تحديث RPC الموافقة على طلب تقديم الصانع لتوليد slug دلالي من التخصص والاسم
CREATE OR REPLACE FUNCTION public.approve_craftsman_application(p_craftsman_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_craftsman  public.craftsmen;
  v_cat_slug   text;
  v_clean_name text;
  v_slug       text;
  v_attempt    int := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  SELECT * INTO v_craftsman
  FROM public.craftsmen
  WHERE id = p_craftsman_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;

  IF v_craftsman.status <> 'pending' THEN
    RAISE EXCEPTION 'الطلب اتعامل معاه من قبل';
  END IF;

  IF v_craftsman.name IS NULL OR v_craftsman.category_id IS NULL
     OR v_craftsman.area_id IS NULL OR v_craftsman.phone IS NULL THEN
    RAISE EXCEPTION 'الطلب ناقص ومحتاج مراجعة يدوية';
  END IF;

  IF v_craftsman.submitted_by IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_craftsman.submitted_by AND craftsman_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'المقدم يمتلك صنايعي بالفعل — اربط حسابه الموجود مباشرة';
    END IF;
  END IF;

  -- استخراج slug التخصص
  SELECT slug INTO v_cat_slug
  FROM public.categories
  WHERE id = v_craftsman.category_id;

  -- تنظيف اسم الصانع: الإبقاء على الحروف العربية والإنجليزية والأرقام
  v_clean_name := lower(regexp_replace(v_craftsman.name, '[^a-zA-Z0-9\u0621-\u064A\u0660-\u0669]+', '-', 'g'));
  v_clean_name := trim(both '-' from v_clean_name);

  -- إذا كان الاسم بعد التنظيف أقصر من حرفين
  IF length(v_clean_name) < 2 THEN
    v_clean_name := 'craftsman';
  ELSIF length(v_clean_name) > 35 THEN
    v_clean_name := substr(v_clean_name, 1, 35);
    v_clean_name := trim(trailing '-' from v_clean_name);
  END IF;

  LOOP
    v_attempt := v_attempt + 1;
    -- توليد الرابط: التخصص + الاسم المنظف + هاش عشوائي فريد من 6 أحرف
    v_slug := coalesce(v_cat_slug, 'craftsman') || '-' || v_clean_name || '-' || substr(md5(gen_random_uuid()::text), 1, 6);

    BEGIN
      UPDATE public.craftsmen
      SET status = 'approved',
          is_published = true,
          slug = v_slug
      WHERE id = p_craftsman_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 5 THEN
        RAISE EXCEPTION 'تعذر توليد رابط فريد للصنايعي — جرّب تاني';
      END IF;
    END;
  END LOOP;

  IF v_craftsman.submitted_by IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'craftsman',
        craftsman_id = p_craftsman_id
    WHERE id = v_craftsman.submitted_by;
  END IF;

  RETURN p_craftsman_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.approve_craftsman_application(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_craftsman_application(uuid) TO authenticated;

COMMENT ON FUNCTION public.approve_craftsman_application(uuid) IS
  'الموافقة على طلب صانع وتوليد slug دلالي عربي/إنجليزي يجمع بين التخصص والاسم والهاش ونشره وربط بروفايله';


-- 2) تحديث دالة increment_craftsman_stats لدعم الـ Slugs التي تحتوي على حروف عربية
CREATE OR REPLACE FUNCTION public.increment_craftsman_stats(
  p_slug   text,
  p_action text,
  p_ip     text DEFAULT '0.0.0.0'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_craftsman_id uuid;
  v_rl          jsonb;
begin
  -- تحقق داخلي مطابق لقيد الـ route — يدعم الحروف العربية والإنجليزية والأرقام حتى 90 حرفاً
  if p_slug is null
     or length(p_slug) = 0
     or length(p_slug) > 90
     or p_slug !~ '^[a-z0-9\u0621-\u064A\u0660-\u0669]+(?:-[a-z0-9\u0621-\u064A\u0660-\u0669]+)*$' then
    return false;
  end if;

  if p_action is null or p_action not in ('view', 'call', 'whatsapp') then
    return false;
  end if;

  -- Rate limit دفاعي داخلي عبر مخزن rate_limits المشترك
  select public.rate_limit_consume(
    'stats:rpc:' || coalesce(p_ip, '0.0.0.0') || ':' || p_slug,
    120,
    60
  ) into v_rl;

  if not coalesce((v_rl->>'allowed')::boolean, false) then
    return false;
  end if;

  select id into v_craftsman_id
  from public.craftsmen
  where slug = p_slug and is_published = true;

  if v_craftsman_id is null then
    return false;
  end if;

  -- كتابة واحدة UPSERT للعدّادات التراكمية
  insert into public.craftsman_stats (craftsman_id, views, calls, whatsapp)
  values (
    v_craftsman_id,
    case when p_action = 'view' then 1 else 0 end,
    case when p_action = 'call' then 1 else 0 end,
    case when p_action = 'whatsapp' then 1 else 0 end
  )
  on conflict (craftsman_id) do update set
    views      = case when p_action = 'view' then public.craftsman_stats.views + 1 else public.craftsman_stats.views end,
    calls      = case when p_action = 'call' then public.craftsman_stats.calls + 1 else public.craftsman_stats.calls end,
    whatsapp   = case when p_action = 'whatsapp' then public.craftsman_stats.whatsapp + 1 else public.craftsman_stats.whatsapp end,
    updated_at = now();

  -- UPSERT يومي داخل نفس المعاملة — أساس خط الزمن للوحة المشرف
  insert into public.craftsman_stats_daily (craftsman_id, day, views, calls, whatsapp)
  values (
    v_craftsman_id,
    current_date,
    case when p_action = 'view' then 1 else 0 end,
    case when p_action = 'call' then 1 else 0 end,
    case when p_action = 'whatsapp' then 1 else 0 end
  )
  on conflict (craftsman_id, day) do update set
    views    = public.craftsman_stats_daily.views + excluded.views,
    calls    = public.craftsman_stats_daily.calls + excluded.calls,
    whatsapp = public.craftsman_stats_daily.whatsapp + excluded.whatsapp;

  return true;
end;
$function$;

REVOKE ALL ON FUNCTION public.increment_craftsman_stats(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_craftsman_stats(text, text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.increment_craftsman_stats(text, text, text) IS
  'تسجيل تفاعل (مشاهدة/اتصال/واتساب) مع صانع برابط slug عربي أو إنجليزي مع rate limit داخلي';
