-- ============================================================================
-- 0011_analytics_redesign.sql — المرحلة 8: إعادة تصميم نظام الإحصائيات
-- ----------------------------------------------------------------------------
-- القرارات المعتمدة (المرحلة 8 في docs/DATABASE-RULES.md):
--   1) Supabase = عدّادات + حقائق فقط؛ السلوك التفصيلي يُقاس في GA4.
--      `craftsman_stats` هو التخزين الوحيد لتفاعلات الزوار (views/calls/whatsapp)
--      عبر كتابة واحدة UPSERT في `increment_craftsman_stats` — لا جدول أحداث خام.
--   2) النسخ الاحتياطي قبل الحذف (إلزامي): نسخة من `craftsman_events` ودوال
--      الحزمة القديمة تُؤخذ خارجياً قبل التطبيق (pg_dump/migration rollback) —
--      الحذف هنا شامل بعد التحقق من عدم وجود مراجع داخل السلسلة: الاعتماديات
--      الوحيدة هي دوال/سياسات/فهرس الجدول نفسه وجميعها تُحذف معه.
--   3) حزمة الأحداث القديمة تُحذف نهائياً:
--        * جدول `craftsman_events` (كان live-only بلا معرف في السلسلة) + فهرسه + سياساته.
--        * دالة `record_craftsman_event` (الاستثناء العام القديم).
--        * دالة التحليلات `get_analytics_overview` (تقرأ أحداث).
--        * دالة التوصية التعاونية `get_related_craftsmen` (تقرأ أحداث) —
--          قسم «شاهد أيضاً» أصبح بلا events (تخصص + منطقة + popularity في lib).
--   4) RPC جديد للكتابة الوحيدة `increment_craftsman_stats(p_slug, p_action, p_ip)`:
--      SECURITY DEFINER + search_path pinned + تحقق شكل slug + whitelist action
--      + rate limit دفاعي داخلي عبر `rate_limit_consume` (مخزن الخادم المشترك)
--      + بحث الصنايعي المنشور فقط + UPSERT واحد للعدّادات. استثناء EXECUTE عام
--      موثّق (تسجيل تفاعلات anon) — تحدّد المدخلات داخلياً ولا تكشف بيانات.
--   5) RPC قراءة جديد `get_site_stats()`: SECURITY DEFINER + فحص is_admin() —
--      حقائق الموقع للوحة المشرف (مستخدمون/صنايعة/طلبات/تقييمات/مفضلة) — EXECUTE
--      لـ authenticated فقط (بلا anon/PUBLIC).
--   6) حوكمة: `craftsman_stats` (كان صراحةً live-only بلا معرف في السلسلة) يُعلَن
--      في السلسلة idempotent (CREATE TABLE IF NOT EXISTS) + سياساته + grants.
-- بلا ترحيل بيانات: العدّادات القائمة في `craftsman_stats` تبقى كما هي.
-- ============================================================================

BEGIN;

-- ==================== PART 1 — حوكمة craftsman_stats ========================

CREATE TABLE IF NOT EXISTS public.craftsman_stats (
  craftsman_id uuid PRIMARY KEY REFERENCES public.craftsmen(id) ON DELETE CASCADE,
  views        integer NOT NULL DEFAULT 0,
  calls        integer NOT NULL DEFAULT 0,
  whatsapp     integer NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.craftsman_stats ENABLE ROW LEVEL SECURITY;

-- قراءة عامة للمنشورين فقط
DROP POLICY IF EXISTS "craftsman_stats public read" ON public.craftsman_stats;
CREATE POLICY "craftsman_stats public read"
  ON public.craftsman_stats FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.craftsmen c
      WHERE c.id = craftsman_stats.craftsman_id
        AND c.is_published = true
    )
    OR (SELECT public.is_admin())
  );

-- الفني يقرأ صفّه عبر get_my_craftsman_id() بلا auth.role()
DROP POLICY IF EXISTS "craftsman_stats craftsman read own" ON public.craftsman_stats;
CREATE POLICY "craftsman_stats craftsman read own"
  ON public.craftsman_stats FOR SELECT
  TO authenticated
  USING (craftsman_id = (SELECT public.get_my_craftsman_id()));

-- المشرف يدير الكل
DROP POLICY IF EXISTS "craftsman_stats admin all" ON public.craftsman_stats;
CREATE POLICY "craftsman_stats admin all"
  ON public.craftsman_stats FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- منح صريحة مطابقة لمصفوفة الأدوار (الجدول لم تكن له grants مسجلة في السلسلة)
GRANT SELECT ON public.craftsman_stats TO anon, authenticated;
GRANT ALL ON public.craftsman_stats TO authenticated;

-- ==================== PART 2 — حذف الحزمة القديمة ==========================
-- (نسخة احتياطية إلزامية قبل التطبيق — انظر المقدمة)

-- دالة التحليلات القديمة (live-only — تقرأ أحداث craftsman_events)
DROP FUNCTION IF EXISTS public.get_analytics_overview();

-- دالة التوصية التعاونية (live-only — تقرأ أحداث الجلسات): نسقط التحميلات الممكنة
DROP FUNCTION IF EXISTS public.get_related_craftsmen(uuid);
DROP FUNCTION IF EXISTS public.get_related_craftsmen(uuid, integer);

-- دالة تسجيل الأحداث القديمة (التوقيع الكامل 5 معاملات نصية)
DROP FUNCTION IF EXISTS public.record_craftsman_event(text, text, text, text, text);

-- الجدول بلا CASCADE عمداً — أي اعتماد غير متوقع يُوقف الـ migration بصوت عالٍ
DROP TABLE IF EXISTS public.craftsman_events;

-- ==================== PART 3 — عدّاد التفاعلات (كاتب وحيد) ==================

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

  -- كتابة واحدة UPSERT للعدّادات
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

  return true;
end;
$function$;

-- استثناء EXECUTE العام الموثق (التسجيل من anon — بلا كشف أي بيانات)
REVOKE ALL ON FUNCTION public.increment_craftsman_stats(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_craftsman_stats(text, text, text) TO anon, authenticated;

-- ==================== PART 4 — حقائق الموقع (لوحة المشرف) ===================

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
    'favoritesCraftsmen', (select count(DISTINCT craftsman_id) from public.favorites)
  );
end;
$function$;

-- للمشرف فقط (الوصول عبر جلسة authenticated + فحص is_admin() داخل الدالة)
REVOKE ALL ON FUNCTION public.get_site_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_site_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_site_stats() TO authenticated;

COMMIT;