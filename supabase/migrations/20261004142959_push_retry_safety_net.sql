-- =============================================================================
-- 9-fix-2a — خط أمان إعادة المحاولة + تضييق مدى cron
-- =============================================================================
-- يحل مشكلتين اكتشفتهما المراجعة بعد تطبيق 20261004082139:
--
--   A) إعادة محاولة لا نهائية (unbounded retry):
--     finish_push_outbox كان يعيد القصص إلى pending بلا أي حد أعلى لعدد
--     المحاولات. سقف الـ6 محاولات موجود فقط داخل
--     record_push_delivery_result، لكن attempts عمود الـoutbox نفسه
--     ما كانش له أي غطاء. المسار الوحيد لتجاوزه:
--       العامل يموت/انقطع بعد الحجز وقبل كتابة نتيجة أي جهاز
--       (أو فشل استدعاء record_push_delivery_result نفسه).
--     النتيجة: delivery يفضل attempts=0 وnext_attempt_at في الماضي،
--     فيُعاد جدولة القصص فورًا، والعامل cron يعيد المطالبة بها كل
--     5 دقائق إلى ما لا نهاية، بلا أن تصل أي delivery إلى exhausted.
--
--     الاختبار الحي (BEGIN…ROLLBACK) قبل الإصلاح:
--       deliveries_created=2 | after_finish: status=pending
--       outbox_attempts=2 due_now=true lease_cleared=true
--       pending_deliveries_left=2
--
--     الإصلاح: سقف أمان على مستوى القصص (v_max = 12 محاولة). عند بلوغه
--     تُكتب كل الـdeliveries المعلّقة exhausted بوضوح، وتُحسم القصص
--     failed (لا sent) لأن شيئًا لم يُسلَّم فعلاً. تفاصيل كل جهاز
--     تبقى في جدول deliveries — سطر status='exhausted' سبب واضح للفشل.
--
--   B) تضييق مدى فترة إعادة المحاولة إلى 1..59 دقيقة:
--     كان التحقق يسمح 1..1440. pg_cron لا يرفض الصيغة (تم اختبار
--     */60 و*/120 و*/1440 مباشرة على القاعدة الحية فقُبلت جميعها)،
--     لكن دلالة خطوة أكبر من 59 في حقل الدقائق غير موثّقة وغير
--     مُختبَرة ⇒ إعداد كهذا قد يتخزّن بصمت ولا يُطلق شيئًا.
--      تضييق المدى إلى 1..59 يجعل أي قيمة قابلة للتعبير مدعومة
--      فعلاً: أرقام الدقائق هي المدى الحقيقي لحقل الدقائق في cron،
--      وتكفي كل retry معقول لإشعار push.
--
-- ملفات migrations مرقّمة ولا تُعدَّل المطبَّقة ⇒ هذا ملف جديد بعد 082202.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- PART 1 — finish_push_outbox: سقف أمان على مستوى القصص
-- ----------------------------------------------------------------------------
-- السلوك قبل PART 1 (وأثناءه):
--   - lease guard كما هو: لا write إلا بحجز مطابق
--   - اكتمال حقيقي: 0 pending ⇒ sent (تراجع أجهزة فقط، لا فشل)
--   - جديد: 0 pending لكن البلوغ cap ⇒ failed + كل pending exhausted
CREATE OR REPLACE FUNCTION public.finish_push_outbox(
  p_outbox_id  uuid,
  p_lease_id   uuid,
  p_error_text text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lease    uuid;
  v_attempts integer;
  v_pending  integer;
  v_soonest  timestamptz;
  v_capped   boolean := false;
  v_max      constant integer := 12;
BEGIN
  IF p_outbox_id IS NULL OR p_lease_id IS NULL THEN RETURN; END IF;

  -- حارس الحجز: صف حجزته محاولة أحدث ⇒ تجاهُل صامت (لا فشل، لا backoff)
  SELECT lease_id, attempts INTO v_lease, v_attempts
  FROM public.notification_push_outbox
  WHERE id = p_outbox_id AND status = 'processing';

  IF v_lease IS DISTINCT FROM p_lease_id THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_pending
  FROM public.notification_push_deliveries
  WHERE outbox_id = p_outbox_id AND status = 'pending';

  -- خط الأمان: بلوغ سقف محاولات القصص مع بقاء أجهزة بلا نتيجة مُسجّلة
  -- (العامل مات/انقطع قبل التسجيل، أو RPC التسجيل نفسه فشل) ⇒ نكتب
  -- الأجهزة المعلّقة ⇒ نتوقف عن انتظار نتيجة لن تأتي. بدون هذا السطر كان
  -- الـcron يعيد المطالبة بالقصص كل 5 دقائق بلا نهاية.
  IF v_pending > 0 AND v_attempts >= v_max THEN
    UPDATE public.notification_push_deliveries
    SET status     = 'exhausted',
        last_error = left(
          coalesce(
            nullif(btrim(p_error_text), ''),
            'outbox attempt cap reached before any delivery result was recorded'
          ),
          500
        )
    WHERE outbox_id = p_outbox_id AND status = 'pending';

    v_capped := true;
    v_pending := 0;
  END IF;

  -- اكتمل: كل الأجهزة sent | invalid | exhausted
  IF v_pending = 0 THEN
    UPDATE public.notification_push_outbox
    SET status     = CASE WHEN v_capped THEN 'failed' ELSE 'sent' END,
        sent_at    = CASE WHEN v_capped THEN NULL ELSE now() END,
        last_error = left(coalesce(nullif(btrim(p_error_text), ''), ''), 500),
        lease_id   = NULL
    WHERE id = p_outbox_id
      AND status = 'processing'
      AND lease_id = p_lease_id;
    RETURN;
  END IF;

  -- ما زالت هناك أجهزة معلّقة ⇒ يبقى pending حتى أقرب موعد مؤجّل، ويُبلَّغ
  -- عن بقية الأجهزة التي فشلت في هذه الجولة عبر p_error_text.
  SELECT min(next_attempt_at) INTO v_soonest
  FROM public.notification_push_deliveries
  WHERE outbox_id = p_outbox_id AND status = 'pending';

  UPDATE public.notification_push_outbox
  SET status          = 'pending',
      next_attempt_at = coalesce(v_soonest, now()),
      last_error      = left(coalesce(p_error_text, ''), 500),
      lease_id        = NULL
  WHERE id = p_outbox_id
    AND status = 'processing'
    AND lease_id = p_lease_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.finish_push_outbox(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_push_outbox(uuid, uuid, text) TO service_role;

-- ----------------------------------------------------------------------------
-- PART 2 — تضييق مدى الفترة في refresh + upsert (1..59 دقيقة)
-- ----------------------------------------------------------------------------
-- القيم خارج المدى تُسقَط إلى الافتراضي 5 مع تعليق صريح على السبب، بدل
-- تخزين إعداد لا نعرف إن كان سيُطلق شيئًا أصلاً.
CREATE OR REPLACE FUNCTION public.refresh_notification_push_cron()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_jobname constant text := 'retry-notification-push-outbox';
  v_url    text;
  v_apikey text;
  v_secret text;
  v_raw    text;
  v_every  integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN jsonb_build_object('action', 'skipped', 'reason', 'pg_cron غير مثبّت');
  END IF;

  SELECT value INTO v_url    FROM public.push_settings WHERE key = 'push_function_url';
  SELECT value INTO v_apikey FROM public.push_settings WHERE key = 'push_apikey';
  SELECT value INTO v_secret FROM public.push_settings WHERE key = 'push_secret';
  SELECT value INTO v_raw    FROM public.push_settings WHERE key = 'push_retry_interval_minutes';

  -- 1) إلغاء أي جدولة سابقة أولاً ⇒ إعادة البناء آمنة وتفرّد الإعدادات يلغي
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_jobname) THEN
    PERFORM cron.unschedule(v_jobname);
  END IF;

  IF btrim(coalesce(v_url, '')) = ''
     OR btrim(coalesce(v_secret, '')) = ''
     OR btrim(coalesce(v_apikey, '')) = '' THEN
    RETURN jsonb_build_object(
      'action', 'unscheduled',
      'reason', 'إعدادات التوزيع غير مكتملة — أُلغي job إعادة المحاولة');
  END IF;

  BEGIN
    v_every := btrim(v_raw)::integer;
  EXCEPTION WHEN others THEN
    v_every := 5;
  END;
  -- 1..59 فقط: حقل الدقائق في cron لا يقبل خطوة أكبر من مدى الحقل، وpg_cron
  -- لا يرفض الصيغة خارج المدى بل قد يخزّنها دون إطلاق ⇒ نُسقِطها هنا.
  IF v_every IS NULL OR v_every < 1 OR v_every > 59 THEN
    v_every := 5;
  END IF;

  PERFORM cron.schedule(
    v_jobname,
    format('*/%s * * * *', v_every),
    format(
      $job$SELECT net.http_post(url := %L, body := '{}'::jsonb, headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', %L, 'x-push-secret', %L), timeout_milliseconds := 30000)$job$,
      v_url, v_apikey, v_secret
    )
  );

  RETURN jsonb_build_object(
    'action', 'scheduled',
    'jobname', v_jobname,
    'every_minutes', v_every);
END;
$function$;

REVOKE ALL ON FUNCTION public.refresh_notification_push_cron() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.upsert_push_setting(p_key text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_every integer;
BEGIN
  IF p_key NOT IN ('push_function_url', 'push_apikey', 'push_secret',
                   'push_retry_interval_minutes') THEN
    RETURN;
  END IF;

  -- التنفيذ مسموح لـauthenticated لأن POST /api/push/bootstrap يستدعي هذه
  -- الدالة عبر جلسة المشرف (لا يوجد service-role client في هذا المسار).
  -- ⇒ الفحص هنا لا في المسار، وإلا كفى أي مستخدم مسجّل استدعاء الدالة
  -- مباشرة عبر PostgREST فيكتب apikey/secret ويقرأ السر المشترك.
  -- auth.uid() IS NULL يعني استدعاءً داخلياً ويمر بلا فحص.
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role = 'admin'
     ) THEN
    RETURN;
  END IF;

  IF p_key = 'push_retry_interval_minutes' THEN
    BEGIN
      v_every := btrim(coalesce(p_value, ''))::integer;
    EXCEPTION WHEN others THEN
      v_every := 5;
    END;
    -- 1..59 دقيقة: انظر comment في refresh_notification_push_cron
    IF v_every < 1 OR v_every > 59 THEN
      v_every := 5;
    END IF;
    p_value := v_every::text;
  END IF;

  INSERT INTO public.push_settings (key, value)
  VALUES (p_key, p_value)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
END;
$function$;

REVOKE ALL ON FUNCTION public.upsert_push_setting(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_push_setting(text, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- PART 3 — تطبيق المدى الجديد على الجدولة الحيّة فوراً
-- ----------------------------------------------------------------------------
-- بعد تضييق المدى، قد تكون الجدولة القائمة مبنية على قيمة خارج المدى
-- (مثل 120) ⇒ نعيد البناء مرة واحدة هنا لتلتقط القيمة المُسقطة (5) إن لزم.
SELECT public.refresh_notification_push_cron();