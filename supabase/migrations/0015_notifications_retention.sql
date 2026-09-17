-- ============================================================================
-- 0015_notifications_retention.sql — المرحلة 9 (تتمة): احتفاظ الإشعارات (30 يوم)
-- ----------------------------------------------------------------------------
-- القرارات المعتمدة:
--   1) الاحتفاظ: الإشعارات تُحذف تلقائياً بعد 30 يوماً (قرار المستخدم) للحفاظ
--      على حجم الإشعارات والكاش نظيفاً — التنفيذ عبر pg_cron (مثبّت) بجدولة
--      يومية، لا عبر العميل إطلاقاً (لا DELETE من anon/authenticated).
--   2) دالة `purge_old_notifications` SECURITY DEFINER بلا EXECUTE عام — تُستدعى
--      فقط من السيرفر (pg_cron أو مشغّلات داخلية) — نفس نمط `create_notification`.
--   3) Idempotent (CREATE ... IF NOT EXISTS / CREATE OR REPLACE / SELECT WHERE) —
--      قابلة لإعادة التطبيق بلا افتراض على حالة الـ live.
-- ============================================================================

BEGIN;

-- فهرس زمني داعم لحذف التقادم (الشرط الزمني فقط — فهرس المستلم الحالي
-- (recipient_id, created_at DESC) لا يخدم استعلام حذف بـ created_at وحده)
CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON public.notifications (created_at);

-- ----------------------------------------------------------------------------
-- دالة التنظيف: تحذف الإشعارات الأقدم من p_max_age_days (افتراضي 30 يوماً)
-- وتعيد عدد الصفوف المحذوفة. server-only — لا EXECUTE للعميل إطلاقاً.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_old_notifications(
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
  DELETE FROM public.notifications WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- لا EXECUTE عام: من السيرفر فقط (pg_cron/مشغّلات) — بلا anon ولا authenticated
REVOKE ALL ON FUNCTION public.purge_old_notifications(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_old_notifications(integer) FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- جدولة يومية (03:00) عبر pg_cron — idempotent: تُلغى مهمة قديمة بنفس الاسم
-- (إن وُجدت) ثم تُنشأ من جديد، فلا تتكدّس وظائف مكررة عند إعادة التطبيق.
-- ----------------------------------------------------------------------------
SELECT cron.unschedule('purge-notifications-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-notifications-daily');

SELECT cron.schedule(
  'purge-notifications-daily',
  '0 3 * * *',
  'select public.purge_old_notifications();'
);

-- تنظيف أولي: إزالة أي إشعارات حالية تجاوزت 30 يوماً فوراً
SELECT public.purge_old_notifications(30);

COMMIT;