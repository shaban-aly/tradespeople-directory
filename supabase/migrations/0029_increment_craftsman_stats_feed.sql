-- ============================================================================
-- 0029_increment_craftsman_stats_feed.sql — ربط تسجيل العدادات بسجل التفاعلات اللحظية
-- ----------------------------------------------------------------------------
-- يحدّث:
--   دالة `increment_craftsman_stats`:
--     - تقبل معاملات اختيارية: p_user_id (uuid) و p_user_status (text).
--     - عند تسجيل 'call' أو 'whatsapp'، تُدرج المعاملة سجلاً تلقائياً في `interaction_logs`.
--     - المعاملة ذرية (Atomic Transaction): العداد التراكمي + اليومي + سجل التفاعل في عملية واحدة.
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.increment_craftsman_stats(text, text, text);

CREATE OR REPLACE FUNCTION public.increment_craftsman_stats(
  p_slug        text,
  p_action      text,
  p_ip          text DEFAULT '0.0.0.0'::text,
  p_user_id     uuid DEFAULT NULL::uuid,
  p_user_status text DEFAULT 'anonymous'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_craftsman_id  uuid;
  v_rl            jsonb;
  v_status_clean  text;
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

  -- تنظيف حالة المستخدم لضمان مطابقة قيد CHECK
  v_status_clean := case 
    when p_user_status in ('authenticated', 'anonymous') then p_user_status 
    else 'anonymous' 
  end;

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

  -- 1) كتابة واحدة UPSERT للعدّادات التراكمية
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

  -- 2) UPSERT يومي داخل نفس المعاملة — أساس خط الزمن للوحة المشرف
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

  -- 3) إدراج سجل التفاعل اللحظي عند عمليات التواصل (اتصال / واتساب)
  if p_action in ('call', 'whatsapp') then
    insert into public.interaction_logs (
      craftsman_id,
      contact_method,
      user_id,
      user_status
    ) values (
      v_craftsman_id,
      case when p_action = 'call' then 'phone' else 'whatsapp' end,
      p_user_id,
      v_status_clean
    );
  end if;

  return true;
end;
$function$;

REVOKE ALL ON FUNCTION public.increment_craftsman_stats(text, text, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_craftsman_stats(text, text, text, uuid, text) TO anon, authenticated;

COMMENT ON FUNCTION public.increment_craftsman_stats(text, text, text, uuid, text) IS
  'تسجيل تفاعل (مشاهدة/اتصال/واتساب) مع صانع، وزيادة العداد التراكمي واليومي وتدوين سجل التفاعل اللحظي في معاملة واحدة';

COMMIT;
