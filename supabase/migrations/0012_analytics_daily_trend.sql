-- ============================================================================
-- 0012_analytics_daily_trend.sql — العدّاد اليومي + خط الزمن + نسبة التحويل
-- ----------------------------------------------------------------------------
-- يُضيف بُعداً زمنياً على نظام العدّادات (مرحلة 0011) ليتحوّل قسم الإحصائيات
-- في لوحة المشرف من أرقام تراكمية صمّاء إلى لوحة حيّة (هيرو اليوم + خط زمني
-- لآخر 7 أيام + حلقة نسبة التحويل):
--   1) جدول `craftsman_stats_daily`: عدّادات لكل (craftsman_id, day) — يُكتب
--      عبر `increment_craftsman_stats` فقط (نفس كاتب 0011) بلا جداول أحداث خام.
--   2) `increment_craftsman_stats` (نفس التوقيع والصلاحيات) تُضاف إليها كتلة
--      UPSERT يومية داخل نفس المعاملة — العدّاد التراكمي واليومي يتقدّمان معاً.
--   3) `get_site_stats` تُوسَّع بطول خرجها: `viewsToday`/`callsToday`/
--      `whatsappToday`/`contactsToday` + `conversionRate7d` (جزء 0..1) +
--      سلسلة `daily` (آخر 7 أيام تصاعدياً) — الأدمن فقط كما هي.
-- ============================================================================

BEGIN;

-- ==================== PART 1 — جدول العدّادات اليومية =======================

CREATE TABLE IF NOT EXISTS public.craftsman_stats_daily (
  craftsman_id uuid NOT NULL REFERENCES public.craftsmen(id) ON DELETE CASCADE,
  day          date NOT NULL DEFAULT current_date,
  views        integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  calls        integer NOT NULL DEFAULT 0 CHECK (calls >= 0),
  whatsapp     integer NOT NULL DEFAULT 0 CHECK (whatsapp >= 0),
  PRIMARY KEY (craftsman_id, day)
);

COMMENT ON TABLE public.craftsman_stats_daily IS
  'عدّادات التفاعل اليومية لكل صنايعي — أساس خط الزمن في لوحة المشرف (تُكتب عبر increment_craftsman_stats فقط)';

ALTER TABLE public.craftsman_stats_daily ENABLE ROW LEVEL SECURITY;

-- للقراءات الزمنية في get_site_stats (period range)
CREATE INDEX IF NOT EXISTS craftsman_stats_daily_day_idx
  ON public.craftsman_stats_daily (day);

-- قراءة عامة للمنشورين فقط (بلا auth.role() — نفس نمط craftsman_stats)
DROP POLICY IF EXISTS "craftsman_stats_daily public read" ON public.craftsman_stats_daily;
CREATE POLICY "craftsman_stats_daily public read"
  ON public.craftsman_stats_daily FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.craftsmen c
      WHERE c.id = craftsman_stats_daily.craftsman_id
        AND c.is_published = true
    )
    OR (SELECT public.is_admin())
  );

-- الفني يقرأ صفّه عبر get_my_craftsman_id() بلا auth.role()
DROP POLICY IF EXISTS "craftsman_stats_daily craftsman read own" ON public.craftsman_stats_daily;
CREATE POLICY "craftsman_stats_daily craftsman read own"
  ON public.craftsman_stats_daily FOR SELECT
  TO authenticated
  USING (craftsman_id = (SELECT public.get_my_craftsman_id()));

-- المشرف يدير الكل
DROP POLICY IF EXISTS "craftsman_stats_daily admin all" ON public.craftsman_stats_daily;
CREATE POLICY "craftsman_stats_daily admin all"
  ON public.craftsman_stats_daily FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- منح صريحة مطابقة لمصفوفة الأدوار (مثل craftsman_stats)
GRANT SELECT ON public.craftsman_stats_daily TO anon, authenticated;
GRANT ALL ON public.craftsman_stats_daily TO authenticated;

-- ==================== PART 2 — تحديث كاتب التفاعلات (UPSERT يومي) ===========
-- نفس التوقيع والصلاحيات (EXECUTE عام موثّق لتسجيل anon) — تُضاف كتلة يومية
-- داخل نفس المعاملة: لا انفصال بين العدّاد التراكمي واليومي.

CREATE OR REPLACE FUNCTION public.increment_craftsman_stats(
  p_slug  text,
  p_action text,
  p_ip    text DEFAULT '0.0.0.0'::text
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
  -- تحقق داخلي مطابق لقيد الـ route — منع مدخلات ضخمة عبر الاستدعاء المباشر
  if p_slug is null
     or length(p_slug) = 0
     or length(p_slug) > 60
     or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    return false;
  end if;

  if p_action is null or p_action not in ('view', 'call', 'whatsapp') then
    return false;
  end if;

  -- Rate limit دفاعي داخلي عبر مخزن rate_limits المشترك (حتى لو استُدعيت الدالة
  -- مباشرة بلا المرور على /api/stats). الحدود مفروضة في rate_limit_consume
  -- (limit ≤ 5000) ولا تُكشف أي بيانات — يعيد only allowed/remaining.
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

-- استثناء EXECUTE العام الموثق (التسجيل من anon — بلا كشف أي بيانات)
REVOKE ALL ON FUNCTION public.increment_craftsman_stats(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_craftsman_stats(text, text, text) TO anon, authenticated;

-- ==================== PART 3 — توسيع حقائق الموقع (اليوم + الخط الزمني) =====

CREATE OR REPLACE FUNCTION public.get_site_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'غير مصرح — يلزم المشرف' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'totalUsers',         (select count(*) from public.profiles),
    'publishedCraftsmen', (select count(*) from public.craftsmen where is_published = true and status = 'approved'),
    'pendingRequests',    (select count(*) from public.craftsmen where status = 'pending'),
    'totalReviews',       (select count(*) from public.reviews),
    'averageRating',      (select coalesce(round(avg(rating)::numeric, 1), 0) from public.reviews),
    'totalFavorites',     (select count(*) from public.favorites),
    'favoritesCraftsmen', (select count(DISTINCT craftsman_id) from public.favorites),
    'viewsToday',         (select coalesce(sum(views), 0) from public.craftsman_stats_daily where day = current_date),
    'callsToday',         (select coalesce(sum(calls), 0) from public.craftsman_stats_daily where day = current_date),
    'whatsappToday',      (select coalesce(sum(whatsapp), 0) from public.craftsman_stats_daily where day = current_date),
    'contactsToday',      (select coalesce(sum(calls), 0) + coalesce(sum(whatsapp), 0) from public.craftsman_stats_daily where day = current_date),
    'conversionRate7d',   (select case when coalesce(sum(views), 0) = 0 then 0 else round((coalesce(sum(calls), 0) + coalesce(sum(whatsapp), 0))::numeric / sum(views), 4) end from public.craftsman_stats_daily where day >= (current_date - 6)),
    'daily',              (select coalesce(jsonb_agg(jsonb_build_object(
                              'day', d.day,
                              'views', d.views,
                              'calls', d.calls,
                              'whatsapp', d.whatsapp,
                              'contacts', d.calls + d.whatsapp
                            ) order by d.day), '[]'::jsonb)
                           from (
                             select day,
                                    sum(views)::integer    as views,
                                    sum(calls)::integer    as calls,
                                    sum(whatsapp)::integer as whatsapp
                             from public.craftsman_stats_daily
                             where day >= (current_date - 6)
                             group by day
                           ) d)
  );
end;
$function$;

-- للمشرف فقط (الوصول عبر جلسة authenticated + فحص is_admin() داخل الدالة)
REVOKE ALL ON FUNCTION public.get_site_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_site_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_site_stats() TO authenticated;

COMMIT;