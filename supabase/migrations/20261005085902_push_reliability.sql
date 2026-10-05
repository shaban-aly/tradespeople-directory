-- =============================================================================
-- 20261005085902_push_reliability — آلات إعادة المحاولة للزائر المجهول
--                     + refresh cron غير هدّام + قابلية ملاحظة جانب العميل
-- =============================================================================
-- =============================================================================
-- Push reliability — anonymous retry machinery, non-destructive cron refresh,
--                    and client-side diagnostics
-- =============================================================================
-- ثلاثة أعطال حقيقية في مسار التسليم، جميعها خارج نطاق ما عولج سابقاً:
--
-- (1) مسار الزائر المجهول بلا إعادة محاولة إطلاقاً.
--     `anonymous_push_outbox` لم يكن يملك attempts/lease/next_attempt_at، وكانت
--     `send-push` تحاول مرة واحدة بمهلة 5 ثوانٍ ثم تضع `skipped`/`failed`
--     نهائياً، ولا cron يلتقطها أصلاً ⇒ أي فشل عابر = ضياع دائم. مسار المسجَّلين
--     وحده كان له lease وإعادة محاولة وسقف؛ هذه المعالجة تُعمَّم على المجهول.
--
-- (2) `refresh_notification_push_cron()` كانت تنفّذ `cron.unschedule` **قبل** أن
--     تتحقق من اكتمال الإعدادات. أي كتابة في `push_settings` بثلاثية ناقصة كانت
--     تحذف job عاملاً ولا تُعيده. هنا: نتحقق أولاً، ولا نُلغي job على إعدادات ناقصة.
--
-- (3) صفر قابلية ملاحظة على جانب العميل.
--     `notification_push_deliveries` تسجّل موافقة FCM على الإرسال فقط، وكل أخطاء
--     المتصفح كانت تُبتلع بـ`catch { return null }`. الفقد بعد موافقة FCM — وهو
--     الجزء الذي يقع فعلياً — كان غير مرئي. `push_client_diagnostics` يجعله مرئى.
--
-- `send-push` في وضع العامل يلتقط المسارين معاً، فالمهمة المجدولة أدناه تستعمل
-- نفس أمر الـ HTTP لمسار المسجَّلين (body فارغ = worker).
-- =============================================================================
-- ملاحظة: قيد حالة `processing` على `anonymous_push_outbox` ليس هنا بل في
-- المهاجرة التالية `20261005090046` — ظهر عند أول تطبيق أن الـ CHECK الصادر
-- من 0017 كان يرفض الحالة التي ولّدتها آلة الحجز نفسها.

-- -----------------------------------------------------------------------------
-- PART 1 — آلات إعادة المحاولة لمسار الزائر المجهول
-- -----------------------------------------------------------------------------

ALTER TABLE public.anonymous_push_outbox
  ADD COLUMN IF NOT EXISTS attempts        integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_error      text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS lease_id        uuid,
  ADD COLUMN IF NOT EXISTS sent_at         timestamptz;

COMMENT ON COLUMN public.anonymous_push_outbox.attempts IS
  'عدد محاولات الإرسال؛ يزداد عند الحجز ويحدد سقف المحاولات والتراجع.';
COMMENT ON COLUMN public.anonymous_push_outbox.lease_id IS
  'حجز المحاولة الحالية؛ يتجاهل finish أي استدعاء يحمل lease غير مطابق.';


-- يخدم استعلام الحجز: الصفوف الجاهزة وحدها، مرتبة بالأقدم.
CREATE INDEX IF NOT EXISTS idx_anonymous_push_outbox_ready
  ON public.anonymous_push_outbox (next_attempt_at ASC, created_at ASC)
  WHERE status IN ('pending', 'processing');

-- -----------------------------------------------------------------------------
-- PART 2 — claim / finish لمسار المجهول
-- -----------------------------------------------------------------------------
-- فرق دلالي مقصود عن المسجَّلين: المسجَّل يحتفظ بـ`notification_push_deliveries`
-- لكل جهاز فيعرف أي جهاز أخفق بالضبط، والمجهول يجيب بعدد successes/failures
-- فقط. لذلك "نجاح جزئي" حالة نهائية هنا: إعادة القصة بعد نجاح جزئي تعيد إشعاراً
-- وصل فعلاً، وهو أسوأ من القبول بفقدان الباقي.

CREATE OR REPLACE FUNCTION public.claim_anonymous_push_outbox(p_limit integer DEFAULT 10)
 RETURNS SETOF anonymous_push_outbox
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_limit integer;
BEGIN
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);

  RETURN QUERY
  WITH ready AS (
    SELECT o.id
    FROM public.anonymous_push_outbox o
    WHERE
      (o.status = 'pending' AND o.next_attempt_at <= now())
      OR
      (o.status = 'processing'
       AND o.last_attempt_at IS NOT NULL
       AND o.last_attempt_at < now() - interval '10 minutes')
    ORDER BY o.next_attempt_at ASC, o.created_at ASC
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.anonymous_push_outbox o
  SET status          = 'processing',
      attempts        = o.attempts + 1,
      last_attempt_at = now(),
      last_error      = '',
      lease_id        = gen_random_uuid()
  FROM ready r
  WHERE o.id = r.id
  RETURNING o.*;
END;
$function$;

CREATE OR REPLACE FUNCTION public.finish_anonymous_push_outbox(
  p_outbox_id  uuid,
  p_lease_id   uuid,
  p_sent       integer DEFAULT 0,
  p_failed     integer DEFAULT 0,
  p_terminal   text    DEFAULT NULL,
  p_error_text text    DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lease    uuid;
  v_attempts integer;
  v_max      constant integer := 12;
  v_backoff  integer;
BEGIN
  IF p_outbox_id IS NULL OR p_lease_id IS NULL THEN RETURN; END IF;

  -- حارس الحجز: صف حجزته محاولة أحدث ⇒ تجاهل صامت (لا فشل ولا تراجع).
  SELECT lease_id, attempts INTO v_lease, v_attempts
  FROM public.anonymous_push_outbox
  WHERE id = p_outbox_id AND status = 'processing';

  IF v_lease IS DISTINCT FROM p_lease_id THEN
    RETURN;
  END IF;

  v_backoff := LEAST(GREATEST((power(2, GREATEST(v_attempts, 1)))::integer, 2), 60);

  -- (أ) حالة نهائية يقررها الدالة صراحةً: sent | skipped
  IF p_terminal IN ('sent', 'skipped') THEN
    UPDATE public.anonymous_push_outbox
    SET status     = p_terminal,
        sent_at    = CASE WHEN p_terminal = 'sent' THEN now() ELSE NULL END,
        last_error = left(coalesce(nullif(btrim(p_error_text), ''), ''), 500),
        lease_id   = NULL
    WHERE id = p_outbox_id
      AND status = 'processing'
      AND lease_id = p_lease_id;
    RETURN;
  END IF;

  -- (ب) نجاح واحد على الأقل ⇒ نهائي حتى لو أخفق بعضها (لا إعادة إشعار لوصل).
  IF COALESCE(p_sent, 0) > 0 THEN
    UPDATE public.anonymous_push_outbox
    SET status     = 'sent',
        sent_at    = now(),
        last_error = CASE
                       WHEN COALESCE(p_failed, 0) > 0
                         THEN left(coalesce(
                           'partial: sent=' || p_sent || ' failed=' || p_failed
                             || ' ' || coalesce(nullif(btrim(p_error_text), ''), ''),
                           ''
                         ), 500)
                       ELSE left(coalesce(nullif(btrim(p_error_text), ''), ''), 500)
                     END,
        lease_id   = NULL
    WHERE id = p_outbox_id
      AND status = 'processing'
      AND lease_id = p_lease_id;
    RETURN;
  END IF;

  -- (ج) فشل كامل: تراجع أسّي حتى السقف، ثم failed نهائي.
  IF v_attempts >= v_max THEN
    UPDATE public.anonymous_push_outbox
    SET status     = 'failed',
        last_error = left(
          coalesce(
            nullif(btrim(p_error_text), ''),
            'anonymous outbox attempt cap reached with zero successful delivery'
          ),
          500
        ),
        lease_id   = NULL
    WHERE id = p_outbox_id
      AND status = 'processing'
      AND lease_id = p_lease_id;
    RETURN;
  END IF;

  UPDATE public.anonymous_push_outbox
  SET status          = 'pending',
      next_attempt_at = now() + make_interval(mins => v_backoff),
      last_error      = left(coalesce(p_error_text, ''), 500),
      lease_id        = NULL
  WHERE id = p_outbox_id
    AND status = 'processing'
    AND lease_id = p_lease_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_anonymous_push_outbox(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_anonymous_push_outbox(uuid, uuid, integer, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.claim_anonymous_push_outbox(integer)  TO service_role;
GRANT  EXECUTE ON FUNCTION public.finish_anonymous_push_outbox(uuid, uuid, integer, integer, text, text) TO service_role;

-- -----------------------------------------------------------------------------
-- PART 3 — `refresh_notification_push_cron` غير هدّام، ويغطي المسارين
-- -----------------------------------------------------------------------------
-- الترتيب الآن: تحقق أولاً، ثم ألغِ فقط ما أنت متأكد أنك ستعيد إنشاءه.
-- إعدادات ناقصة ⇒ لا يُفقد أي job عامل. كما صار للمجهول job باسمه بدل الاعتماد
-- على job واحد بلا تمييز.

CREATE OR REPLACE FUNCTION public.refresh_notification_push_cron()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_jobs  constant text[] := ARRAY[
    'retry-notification-push-outbox',
    'retry-anonymous-push-outbox'
  ];
  v_job   text;
  v_url    text;
  v_apikey text;
  v_secret text;
  v_raw    text;
  v_every  integer;
  v_cmd    text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN jsonb_build_object('action', 'skipped', 'reason', 'pg_cron not installed');
  END IF;

  SELECT value INTO v_url    FROM public.push_settings WHERE key = 'push_function_url';
  SELECT value INTO v_apikey FROM public.push_settings WHERE key = 'push_apikey';
  SELECT value INTO v_secret FROM public.push_settings WHERE key = 'push_secret';
  SELECT value INTO v_raw    FROM public.push_settings WHERE key = 'push_retry_interval_minutes';

  -- (1) تحقق أولاً: لا إلغاء على إعدادات ناقصة.
  IF btrim(coalesce(v_url, '')) = ''
     OR btrim(coalesce(v_secret, '')) = ''
     OR btrim(coalesce(v_apikey, '')) = '' THEN
    RETURN jsonb_build_object(
      'action', 'incomplete',
      'reason', 'incomplete push settings — existing jobs left untouched');
  END IF;

  BEGIN
    v_every := btrim(v_raw)::integer;
  EXCEPTION WHEN others THEN
    v_every := 5;
  END;
  -- 1..59 فقط: حقل الدقائق في cron لا يتجاوز هذا المدى.
  IF v_every IS NULL OR v_every < 1 OR v_every > 59 THEN
    v_every := 5;
  END IF;

  v_cmd := format(
    $job$SELECT net.http_post(url := %L, body := '{}'::jsonb, headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', %L, 'x-push-secret', %L), timeout_milliseconds := 30000)$job$,
    v_url, v_apikey, v_secret
  );

  -- (2) الآن فقط نلغي ما نعرف أننا سنعيد إنشاءه، لأن الضمان أعلاه.
  FOREACH v_job IN ARRAY v_jobs LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_job) THEN
      PERFORM cron.unschedule(v_job);
    END IF;
  END LOOP;

  FOREACH v_job IN ARRAY v_jobs LOOP
    PERFORM cron.schedule(v_job, format('*/%s * * * *', v_every), v_cmd);
  END LOOP;

  RETURN jsonb_build_object(
    'action', 'scheduled',
    'jobs', to_jsonb(v_jobs),
    'every_minutes', v_every);
END;
$function$;

REVOKE ALL ON FUNCTION public.refresh_notification_push_cron() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.refresh_notification_push_cron() TO service_role;

-- job المجهول غير موجود قبل هذه النقطة، فالتطبيق الفوري مطلوب هنا.
SELECT public.refresh_notification_push_cron();

-- -----------------------------------------------------------------------------
-- PART 4 — قابلية ملاحظة جانب العميل
-- -----------------------------------------------------------------------------
-- القاعدة تسجل "ماذا فعل الخادم". كان ينقصها "ماذا فعل المتصفح"، وهو الجزء الذي
-- يفشل فعلياً (permission / Service Worker / getToken).
--
-- لا يخزن أي توكن هنا إطلاقاً: `device_hash` اقتطاع 16 محرفاً من sha256 لمعرف
-- جهاز عشوائي، والسبب والرسالة نص مقصوص فقط.

CREATE TABLE IF NOT EXISTS public.push_client_diagnostics (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  device_hash text        NOT NULL DEFAULT '',
  reason      text        NOT NULL,
  stage       text        NOT NULL DEFAULT '',
  detail      text        NOT NULL DEFAULT '',
  user_agent  text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.push_client_diagnostics IS
  'اخفاقات تسجيل الاشعارات في المتصفح — ما بعد موافقة FCM، وهو الجزء الذي لا تغطيه notification_push_deliveries.';

CREATE INDEX IF NOT EXISTS idx_push_client_diagnostics_created
  ON public.push_client_diagnostics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_client_diagnostics_reason
  ON public.push_client_diagnostics (reason, created_at DESC);

ALTER TABLE public.push_client_diagnostics ENABLE ROW LEVEL SECURITY;

-- لا سياسة كتابة: كل الإدراج عبر الدالة المُعرِّفة أدناه.
DROP POLICY IF EXISTS "admins read push client diagnostics" ON public.push_client_diagnostics;
CREATE POLICY "admins read push client diagnostics"
  ON public.push_client_diagnostics
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- الأسباب المسموح بها فقط: أي نص قادم يُسقط، فلا يتحول الجدول إلى سجل مفتوح.
CREATE OR REPLACE FUNCTION public.report_push_diagnostic(
  p_reason     text,
  p_stage      text DEFAULT '',
  p_detail     text DEFAULT '',
  p_user_agent text DEFAULT '',
  p_device_id  text DEFAULT ''
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_allowed constant text[] := ARRAY[
    'unsupported', 'unconfigured', 'blocked', 'not_granted',
    'sw_failed', 'messaging_failed', 'token_failed', 'register_failed'
  ];
  v_reason text;
  v_uid    uuid;
  v_device text;
  v_key    text;
  v_lim    jsonb;
BEGIN
  v_reason := btrim(coalesce(p_reason, ''));
  IF NOT (v_reason = ANY(v_allowed)) THEN
    RETURN false;
  END IF;

  v_uid := auth.uid();

  -- معرف الجهاز: قيمة عشوائية من localStorage، لا تربط بالمستخدم ولا بالجهاز.
  -- نقتطعه بالـ hash فلا يخزن ما يمكن ربطه بجهاز أو حساب.
  v_device := left(encode(digest(coalesce(p_device_id, ''), 'sha256'), 'hex'), 16);

  -- حد المعدل على (المستخدم أو الجهاز) عبر rate_limit_consume، وهي قائمة على
  -- جدول مشترك لا على عداد داخل العملية.
  v_key := 'push_diag:' || CASE WHEN v_uid IS NOT NULL THEN 'u:' || v_uid::text ELSE 'd:' || v_device END;
  v_lim := public.rate_limit_consume(v_key, 20, 3600);
  IF NOT COALESCE((v_lim ->> 'allowed')::boolean, false) THEN
    RETURN false;
  END IF;

  INSERT INTO public.push_client_diagnostics
    (user_id, device_hash, reason, stage, detail, user_agent)
  VALUES
    (
      v_uid,
      v_device,
      v_reason,
      left(coalesce(p_stage, ''), 60),
      left(coalesce(p_detail, ''), 300),
      left(coalesce(p_user_agent, ''), 300)
    );

  RETURN true;
END;
$function$;

-- التنفيذ عام عمداً: الزائر المجهول نصف الاشتراكات، وهو بالتحديد الفئة
-- الأكثر حاجة للتشخيص. الأمان لا يأتي من تقييد EXECUTE بل من داخل الدالة:
-- قائمة أسباب مغلقة، قصّ نص، حدّ معدّل، ولا كتابة خارج الجدول ولا قراءة منه.
REVOKE ALL ON FUNCTION public.report_push_diagnostic(text, text, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.report_push_diagnostic(text, text, text, text, text) TO anon, authenticated;
