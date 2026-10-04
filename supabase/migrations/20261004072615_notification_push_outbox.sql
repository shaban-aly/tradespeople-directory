-- ============================================================================
-- notification_push_outbox — صندوق صادر مُدار للإشعارات المسجّلة (إعادة محاولة)
-- ----------------------------------------------------------------------------
-- السبب:
--   0016 جعل التوزيع يعتمد على net.http_post من داخل trigger الإدراج.
--   pg_net يرسل الطلب لكنه لا يضمن وصوله ولا ينفّذه: إذا سقطت Edge Function
--   أو رفضت FCM الطلب أو انتهت مهلة الشبكة، ضاع الإشعار بلا أثر — رغم أنه
--   محفوظ في notifications. لا إعادة محاولة ولا تسجيل فشل ولا تنظيف توكنات.
--
-- القرار (يحاكي نفس نمط anonymous_push_outbox في 0017 لكن بإدارة حالة حقيقية):
--   1) جدول notification_push_outbox server-only: صف لكل إشعار مسجّل يحتاج
--      توزيعاً، UNIQUE على notification_id ⇒ لا تكرار في الجدولة.
--   2) trigger الإدراج (enqueue_push_notification) يُدخل الصف في *نفس*
--      المعاملة، ثم يحاول الإرسال الفوري عبر pg_net. فشل pg_net لا يلغي
--      الصف — الملف يبقى pending ويستحق إعادة المحاولة.
--   3) attempts / last_attempt_at / next_attempt_at / last_error / sent_at:
--      backoff أسّي بحد أقصى (1، 2، 4، 8، 16، 32 دقيقة) وسقف 6 محاولات
--      ثم failed نهائي.
--   4) دالة claim_push_outbox(p_limit) بحجز (lease) مدته 10 دقائق
--      تمنع معالجة الصف نفسه مرتين بالتوازي (FOR UPDATE SKIP LOCKED).
--   5) Edge Function send-push تستهلك الصفوف المعلَّمة processing عبر
--      outbox_id بدل notification_id المباشر، وتسجّل sent/failed، وتحذف
--      توكنات FCM المعطّلة فعلياً.
--   6) تنظيف دوري: حذف الصفوف المنتهية (sent/failed/skipped) بعد 7 أيام
--      عبر pg_cron، وحذف الصفوف pending قديمة جداً (أكثر من يومين) كـ failed
--      حتى لا تتراكم بلا معالجة.
--   7) الإدراج من القاعدة فقط: RLS مفعّل بلا سياسات + بلا أي grants
--      لـ anon/authenticated (server-only، يُقرأ بـ service_role من
--      الـ Edge Function).
--   8) idempotent.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PART 1 — جدول الصندوق
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_push_outbox (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid        NOT NULL UNIQUE REFERENCES public.notifications(id) ON DELETE CASCADE,
  recipient_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts        integer     NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error      text        NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz NULL,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz NULL
);

-- server-only: RLS مفعّل بلا سياسات + بلا grants DML لـ anon/authenticated.
-- service_role يتجاوز RLS، لكنه يحتاج امتيازات صريحة (لا يرث شيئاً من PUBLIC).
ALTER TABLE public.notification_push_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_push_outbox FROM anon, authenticated, PUBLIC;
GRANT SELECT, UPDATE, DELETE ON public.notification_push_outbox TO service_role;

-- فهرس العامل: الصفوف الجاهزة للمحاولة (status + next_attempt_at)
CREATE INDEX IF NOT EXISTS notification_push_outbox_claim_idx
  ON public.notification_push_outbox (status, next_attempt_at ASC)
  WHERE status IN ('pending', 'processing');

-- فهرس التنظيف الزمني
CREATE INDEX IF NOT EXISTS notification_push_outbox_created_idx
  ON public.notification_push_outbox (created_at ASC);

-- ----------------------------------------------------------------------------
-- PART 2 — دالة claim: حجز الصفوف الجاهزة بlease ومنع الازدواج
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_push_outbox(p_limit integer DEFAULT 10)
RETURNS SETOF public.notification_push_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_limit integer;
BEGIN
  -- تحقّق داخلي من المدخل (سقف صارم — الدالة server-only)
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);

  RETURN QUERY
  WITH ready AS (
    SELECT o.id
    FROM public.notification_push_outbox o
    WHERE
      (
        o.status = 'pending'
        AND o.next_attempt_at <= now()
      )
      OR
      (
        -- صف عالق في processing من محاولة انقطعت: نعيده للانتظار بعد انتهاء الـ lease
        o.status = 'processing'
        AND o.last_attempt_at IS NOT NULL
        AND o.last_attempt_at < now() - interval '10 minutes'
      )
    ORDER BY o.next_attempt_at ASC, o.created_at ASC
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_push_outbox o
  SET status         = 'processing',
      attempts       = o.attempts + 1,
      last_attempt_at = now(),
      last_error     = ''
  FROM ready r
  WHERE o.id = r.id
  RETURNING o.*;
END;
$function$;

-- الدالتان server-only: تُنفَّذان بـ service_role من الـ Edge Function فقط.
-- بدون GRANT صريح لـ service_role يفشل النداء لأن REVOKE من PUBLIC سحبه.
REVOKE ALL ON FUNCTION public.claim_push_outbox(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_push_outbox(integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_outbox(integer) TO service_role;

-- ----------------------------------------------------------------------------
-- PART 3 — دالة finish: تسجيل نتيجة المحاولة + حساب backoff
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finish_push_outbox(
  p_outbox_id  uuid,
  p_sent       boolean,
  p_error_text text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_row       public.notification_push_outbox%ROWTYPE;
  v_max       constant integer := 6;
  v_backoff   interval;
BEGIN
  IF p_outbox_id IS NULL THEN RETURN; END IF;

  SELECT * INTO v_row FROM public.notification_push_outbox WHERE id = p_outbox_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF p_sent THEN
    UPDATE public.notification_push_outbox
    SET status     = 'sent',
        sent_at    = now(),
        last_error = ''
    WHERE id = p_outbox_id;
    RETURN;
  END IF;

  -- فشل: نحتفظ بآخر خطأ مقصوصاً، ونقرر retry أم failed نهائي
  IF v_row.attempts >= v_max THEN
    UPDATE public.notification_push_outbox
    SET status     = 'failed',
        last_error = left(coalesce(p_error_text, ''), 500)
    WHERE id = p_outbox_id;
    RETURN;
  END IF;

  -- backoff أسّي بالدقائق: 1، 2، 4، 8، 16، 32
  v_backoff := (interval '1 minute' * (2 ^ GREATEST(v_row.attempts - 1, 0)));

  UPDATE public.notification_push_outbox
  SET status       = 'pending',
      next_attempt_at = now() + v_backoff,
      last_error    = left(coalesce(p_error_text, ''), 500)
  WHERE id = p_outbox_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.finish_push_outbox(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finish_push_outbox(uuid, boolean, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_push_outbox(uuid, boolean, text) TO service_role;

-- ----------------------------------------------------------------------------
-- PART 4 — trigger الإنشاء: الصف يدخل نفس المعاملة (لا اعتماد على نجاح HTTP)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_url    text;
  v_apikey text;
  v_secret text;
  v_outbox uuid;
BEGIN
  -- 1) تسجيل الصف داخل نفس المعاملة (يبقى حتى لو فشل الإرسال عبر الشبكة)
  INSERT INTO public.notification_push_outbox (notification_id, recipient_id)
  VALUES (NEW.id, NEW.recipient_id)
  ON CONFLICT (notification_id) DO NOTHING
  RETURNING id INTO v_outbox;

  IF v_outbox IS NULL THEN
    RETURN NEW;  -- الإشعار سبق جدولته — لا إرسال ثانٍ
  END IF;

  -- 2) محاولة الإرسال الفوري (أفضل حالة). فشلها لا يلغي الصف.
  SELECT value INTO v_url    FROM public.push_settings WHERE key = 'push_function_url';
  SELECT value INTO v_apikey FROM public.push_settings WHERE key = 'push_apikey';
  SELECT value INTO v_secret FROM public.push_settings WHERE key = 'push_secret';

  IF btrim(coalesce(v_url, '')) = '' OR btrim(coalesce(v_secret, '')) = '' THEN
    RETURN NEW;  -- غير مهيّأة البنية — الصف يبقى pending حتى تُضبط الإعدادات
  END IF;

  -- 3) نحجز الصف قبل الإرسال الفوري: الـ Edge Function تتجاهل أي صف ليس
  --    processing، فتسليم صف pending كان يجعل التوزيع لا يحدث إطلاقاً.
  --    إن ضاع طلب pg_net أو سقطت الدالة، يبقى الصف processing حتى ينتهي
  --    الـ lease (10 دقائق) فيستعيده claim_push_outbox — لا تضيع رسالة.
  UPDATE public.notification_push_outbox
  SET status          = 'processing',
      attempts        = attempts + 1,
      last_attempt_at = now(),
      last_error      = ''
  WHERE id = v_outbox;

  PERFORM net.http_post(
    url => v_url,
    body => jsonb_build_object('outbox_id', v_outbox::text),
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', coalesce(v_apikey, ''),
      'x-push-secret', v_secret
    ),
    timeout_milliseconds => 5000
  );
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enqueue_push_notification() FROM PUBLIC, anon, authenticated;

-- استبدال trigger 0016 (الإرسال المباشر بـ notification_id) بالجدولة الموحّدة
DROP TRIGGER IF EXISTS trg_notify_push_dispatch ON public.notifications;
CREATE TRIGGER trg_notify_push_dispatch
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_notification();

-- الإرسال القديم لم يعد مستخدماً — نحذفه ونمنع أي تنفيذ له
DROP FUNCTION IF EXISTS public.dispatch_push_notification();

-- ----------------------------------------------------------------------------
-- PART 5 — تنظيف دوري + إعادة محاولة دورية عبر pg_cron
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_url    text;
  v_apikey text;
  v_secret text;
BEGIN
  SELECT value INTO v_url    FROM public.push_settings WHERE key = 'push_function_url';
  SELECT value INTO v_apikey FROM public.push_settings WHERE key = 'push_apikey';
  SELECT value INTO v_secret FROM public.push_settings WHERE key = 'push_secret';

  -- إعادة محاولة: نداء دالة send-push بوضع العامل (بلا body) كل 5 دقائق،
  -- فتسترد الصفوف التي لم يحلها pg_net أو التي أعادت backoff.
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND btrim(coalesce(v_url, '')) <> ''
     AND btrim(coalesce(v_secret, '')) <> ''
     AND NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retry-notification-push-outbox')
  THEN
    PERFORM cron.schedule(
      'retry-notification-push-outbox',
      '*/5 * * * *',
      format(
        $job$SELECT net.http_post(url := %L, body := '{}'::jsonb, headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', %L, 'x-push-secret', %L), timeout_milliseconds := 30000)$job$,
        v_url, coalesce(v_apikey, ''), v_secret
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- صفوف الخلاص تُحذف بعد 7 أيام
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-notification-push-outbox') THEN
      PERFORM cron.schedule(
        'cleanup-notification-push-outbox',
        '30 4 * * *',
        $cron$DELETE FROM public.notification_push_outbox
             WHERE status IN ('sent', 'failed', 'skipped')
               AND COALESCE(sent_at, created_at) < now() - interval '7 days'$cron$
      );
    END IF;

    -- صفوف معلّقة تجاوزت سقف المحاولات تُسقط كـ failed حتى لا تتراكم بلا معالجة
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fail-stale-notification-push-outbox') THEN
      PERFORM cron.schedule(
        'fail-stale-notification-push-outbox',
        '*/30 * * * *',
        $cron$UPDATE public.notification_push_outbox
            SET status = 'failed', last_error = 'stale: no successful dispatch'
          WHERE status IN ('pending', 'processing')
            AND created_at < now() - interval '2 days'
            AND attempts >= 6$cron$
      );
    END IF;
  END IF;
END $$;

COMMIT;
