-- ============================================================================
-- 0028_interaction_logs.sql — سجل التفاعلات اللحظي (Activity Feed) واحتفاظ 30 يوماً
-- ----------------------------------------------------------------------------
-- ينشئ:
--   1) جدول `interaction_logs`: لتسجيل عمليات التواصل اللحظية (اتصال / واتساب).
--   2) فهارس الأداء: على `created_at DESC` و `(craftsman_id, created_at DESC)`.
--   3) سياسات الأمان RLS: مقتصرة تماماً على المشرفين (Admin-only).
--   4) دالة التنظيف `purge_old_interaction_logs`: حذف السجلات الأقدم من 30 يوماً.
--   5) مهمة مجدولة `purge-interaction-logs-daily` عبر pg_cron يومياً (03:30 صباحاً).
--   6) دالة `get_admin_activity_feed`: RPC للمشرفين لجلب السجل مع فلاتر زمنية.
-- ============================================================================

BEGIN;

-- 1) بناء الجدول: interaction_logs
CREATE TABLE IF NOT EXISTS public.interaction_logs (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    craftsman_id  uuid NOT NULL REFERENCES public.craftsmen(id) ON DELETE CASCADE,
    contact_method text NOT NULL CHECK (contact_method IN ('phone', 'whatsapp')),
    user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_status   text NOT NULL DEFAULT 'anonymous' CHECK (user_status IN ('authenticated', 'anonymous')),
    metadata      jsonb DEFAULT '{}'::jsonb,
    created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.interaction_logs IS 
  'سجل التفاعلات اللحظية مع الصنايعية (اتصال / واتساب) — يحتفظ بالبيانات لمدة 30 يوماً فقط';
COMMENT ON COLUMN public.interaction_logs.contact_method IS 'طريقة التواصل: phone أو whatsapp';
COMMENT ON COLUMN public.interaction_logs.user_status IS 'حالة المستخدم: authenticated أو anonymous';

-- 2) بناء الفهارس لتسريع الأداء
CREATE INDEX IF NOT EXISTS idx_interaction_logs_feed 
  ON public.interaction_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_craftsman 
  ON public.interaction_logs (craftsman_id, created_at DESC);

-- 3) تفعيل وتطبيق سياسات الأمان (RLS)
ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interaction_logs admin all" ON public.interaction_logs;
CREATE POLICY "interaction_logs admin all"
  ON public.interaction_logs
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- منع الوصول العام وإتاحة الصلاحيات للأدوار الموثوقة
REVOKE ALL ON public.interaction_logs FROM PUBLIC;
REVOKE ALL ON public.interaction_logs FROM anon;
GRANT ALL ON public.interaction_logs TO authenticated;

-- 4) نظام التنظيف التلقائي (30 يوماً)
CREATE OR REPLACE FUNCTION public.purge_old_interaction_logs(
  p_max_age_days integer DEFAULT 30
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cutoff timestamptz;
  v_count integer;
BEGIN
  IF p_max_age_days IS NULL OR p_max_age_days < 1 OR p_max_age_days > 3660 THEN
    p_max_age_days := 30;
  END IF;

  v_cutoff := now() - make_interval(days => p_max_age_days);
  DELETE FROM public.interaction_logs WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.purge_old_interaction_logs(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_old_interaction_logs(integer) FROM anon, authenticated;

-- جدولة المهمة يومياً الساعة 03:30 عبر pg_cron (idempotent)
SELECT cron.unschedule('purge-interaction-logs-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-interaction-logs-daily');

SELECT cron.schedule(
  'purge-interaction-logs-daily',
  '30 3 * * *',
  'SELECT public.purge_old_interaction_logs(30);'
);

-- 5) دالة واجهة الإدارة (RPC): جلب السجل مع فلاتر زمنية
CREATE OR REPLACE FUNCTION public.get_admin_activity_feed(
  p_timeframe text DEFAULT 'today',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  log_id bigint,
  craftsman_id uuid,
  craftsman_name text,
  craftsman_slug text,
  contact_method text,
  user_status text,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_start_time timestamptz;
BEGIN
  -- التحقق الأمني: المشرفون فقط
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'غير مصرح لك بالوصول — تحتاج صلاحيات مشرف';
  END IF;

  -- تحديد النافذة الزمنية
  v_start_time := CASE p_timeframe
    WHEN 'week'  THEN now() - interval '7 days'
    WHEN 'month' THEN now() - interval '30 days'
    ELSE date_trunc('day', now()) -- 'today'
  END;

  -- حدود الـ limit لضبط الأداء
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 200 THEN
    p_limit := 50;
  END IF;
  IF p_offset IS NULL OR p_offset < 0 THEN
    p_offset := 0;
  END IF;

  RETURN QUERY
  SELECT 
    l.id AS log_id,
    c.id AS craftsman_id,
    c.name AS craftsman_name,
    c.slug AS craftsman_slug,
    l.contact_method,
    l.user_status,
    l.metadata,
    l.created_at
  FROM public.interaction_logs l
  INNER JOIN public.craftsmen c ON c.id = l.craftsman_id
  WHERE l.created_at >= v_start_time
  ORDER BY l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_activity_feed(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_activity_feed(text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_activity_feed(text, integer, integer) TO authenticated;

COMMIT;
