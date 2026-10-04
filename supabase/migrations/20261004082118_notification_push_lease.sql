-- ============================================================================
-- notification_push_lease — ربط إنهاء المحاولة بالحجز الذي أنشأها
-- ----------------------------------------------------------------------------
-- السبب:
--   بعد 20261004072615 أصبحت finish_push_outbox(p_outbox_id, p_sent, …) بلا
--   أي ربط بالحجز. والنتيجة (worker متأخر أو إعادة محاولة) هي أن
--   المحاولة القديمة تُنهي صفاً أعادت محاولة أحدث حجزَه بالفعل:
--     1) العامل أ claiming صفاً، ثم سقط قبل إنهاء الإرسال (انتهت مهلة HTTP).
--     2) بعد 10 دقائق استعاد claim_push_outbox الصفَّ وأعطاه leases جديدة.
--     3) وصل ردّ العامل الأول متأخراً ← finish بلا شرط فيضع الصف «sent»
--        أو «pending» بينما المحاولة الثانية ما زالت في منتصفها.
--   النتيجة: تسليم مكرر لصف لم يُسلَّم، أو ضياع محاولة جديدة كاملة.
--
-- القرار:
--   1) عمود lease_id uuid على الصف: معرّف الحجز. الصف بلا حجز = NULL.
--   2) كل من ينقل الصف إلى processing — claim أو الإرسال الفوري — يولّد
--   lease_id جديداً ويخزّنه، فلا يستطيع أي طرف آخر المساس به.
--   3) finish_push_outbox تستقبل p_lease_id وتشترط في كل UPDATE:
--        id = p_outbox_id AND status = 'processing' AND lease_id = p_lease_id
--   4) عدم تطابق الـlease = «عملية متجاهلة» (لا فشل إرسال): لا تعيد
--      المحاولة ولا تسجّل خطأ، فقط لا تفعل شيئاً — لأن المحاولة الأخرى
--      هي المسؤولة عن lifecycle الصف.
--   5) فهرس فريد جزئي على lease_id: يمنع أن يشترك صفان في حجز واحد
--      (خلل برمجي يجب أن يوقفه القيد لا أن يمرّ صامتاً).
--
-- ملاحظة على التوافق: تغيير توقيع finish_push_outbox يجعل الإصدار القديم
-- منها غير صالح، ولذلك يجب نشر migration مع Edge Function الجديدة معاً
-- (الم-worker القديم يستدعي بالمعاملات القديمة فيسقط الصف إلى processing
-- حتى انتهاء الـlease ثم تستعيده إعادة المحاولة — لا ضياع).
--
-- Idempotent — قابلة لإعادة التطبيق.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PART 1 — عمود الـlease
-- ----------------------------------------------------------------------------
ALTER TABLE public.notification_push_outbox
  ADD COLUMN IF NOT EXISTS lease_id uuid;

-- تذكير: الصف الذي لم يُحجز = lease_id IS NULL
COMMENT ON COLUMN public.notification_push_outbox.lease_id IS
  'معرّف الحجز النشط: NULL = غير محجوز. finish_push_outbox لا تعدّل إلا بمطابقته.';

CREATE UNIQUE INDEX IF NOT EXISTS notification_push_outbox_lease_idx
  ON public.notification_push_outbox (lease_id)
  WHERE lease_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- PART 2 — claim: توليد lease لكل صف محجوز
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
      (o.status = 'pending' AND o.next_attempt_at <= now())
      OR
      -- صف عالق في processing من محاولة انقطعت: بعد انتهاء الـlease نستعيده.
      -- الاستعادة بلا شرط على lease_id مقصودة: هي التي تستبدل الحجز
      -- القديم وتحذف هويته، وإلا استُرجع الصف بلا أن يبطل حق من يحوضه.
      (o.status = 'processing'
       AND o.last_attempt_at IS NOT NULL
       AND o.last_attempt_at < now() - interval '10 minutes')
    ORDER BY o.next_attempt_at ASC, o.created_at ASC
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_push_outbox o
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

REVOKE ALL ON FUNCTION public.claim_push_outbox(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_push_outbox(integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_outbox(integer) TO service_role;

-- ----------------------------------------------------------------------------
-- PART 3 — finish: كل UPDATE مشروط بالـlease
-- ----------------------------------------------------------------------------
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
  v_row     public.notification_push_outbox%ROWTYPE;
  v_max     constant integer := 6;
  v_backoff interval;
BEGIN
  IF p_outbox_id IS NULL OR p_lease_id IS NULL THEN RETURN; END IF;

  SELECT * INTO v_row FROM public.notification_push_outbox WHERE id = p_outbox_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- حارس الحجز: صف حجزته محاولة أحدث لا يجوز لنا لمسه إطلاقاً.
  -- هذا ليس فشل إرسال ⇒ لا تُعدّ المحاولات ولا تسجّل last_error، فقط تجاهُل.
  IF v_row.lease_id IS DISTINCT FROM p_lease_id THEN
    RETURN;
  END IF;
  IF v_row.status <> 'processing' THEN
    RETURN;  -- أنهته محاولة أخرى فعلياً ⇒ تجاهُل
  END IF;

  -- نجاح: لا خطأ مُبلَّغ عنه
  IF p_error_text IS NULL OR btrim(p_error_text) = '' THEN
    UPDATE public.notification_push_outbox
    SET status     = 'sent',
        sent_at    = now(),
        last_error = '',
        lease_id   = NULL
    WHERE id = p_outbox_id
      AND status = 'processing'
      AND lease_id = p_lease_id;
    RETURN;
  END IF;

  -- فشل: نحتفظ بآخر خطأ مقصوصاً، ونقرر retry أم failed نهائي
  IF v_row.attempts >= v_max THEN
    UPDATE public.notification_push_outbox
    SET status     = 'failed',
        last_error = left(p_error_text, 500),
        lease_id   = NULL
    WHERE id = p_outbox_id
      AND status = 'processing'
      AND lease_id = p_lease_id;
    RETURN;
  END IF;

  -- backoff أسّي بالدقائق: 1، 2، 4، 8، 16، 32
  v_backoff := (interval '1 minute' * (2 ^ GREATEST(v_row.attempts - 1, 0)));

  UPDATE public.notification_push_outbox
  SET status          = 'pending',
      next_attempt_at = now() + v_backoff,
      last_error      = left(p_error_text, 500),
      lease_id        = NULL
  WHERE id = p_outbox_id
    AND status = 'processing'
    AND lease_id = p_lease_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.finish_push_outbox(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finish_push_outbox(uuid, uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_push_outbox(uuid, uuid, text) TO service_role;

-- إسقاط التوقيع القديم (uuid, boolean, text) إجباري: لـCREATE OR REPLACE
-- بتوقيع مختلف يُنشئ overload جديداً ولا يستبدل القديم، فيبقى المسار
-- بلا حارس lease قابلاً للاستدعاء. وجوده يخلع الحماية بالكامل. نسقطه
-- صراحةً قبل تعريف النسخة المحمية.
DROP FUNCTION IF EXISTS public.finish_push_outbox(uuid, boolean, text);

-- ----------------------------------------------------------------------------
-- PART 4 — الإرسال الفوري: هو نفسه حجز، فيحتاج lease_id
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
  v_lease  uuid;
BEGIN
  -- 1) تسجيل الصف داخل نفس المعاملة (يبقى حتى لو فشل الإرسال عبر الشبكة)
  INSERT INTO public.notification_push_outbox (notification_id, recipient_id)
  VALUES (NEW.id, NEW.recipient_id)
  ON CONFLICT (notification_id) DO NOTHING
  RETURNING id INTO v_outbox;

  IF v_outbox IS NULL THEN
    RETURN NEW;  -- الإشعار سبق جدولته — لا إرسال ثانٍ
  END IF;

  SELECT value INTO v_url    FROM public.push_settings WHERE key = 'push_function_url';
  SELECT value INTO v_apikey FROM public.push_settings WHERE key = 'push_apikey';
  SELECT value INTO v_secret FROM public.push_settings WHERE key = 'push_secret';

  IF btrim(coalesce(v_url, '')) = '' OR btrim(coalesce(v_secret, '')) = '' THEN
    RETURN NEW;  -- غير مهيّأة البنية — الصف يبقى pending حتى تُضبط الإعدادات
  END IF;

  -- 2) نحجز الصف قبل الإرسال الفوري (مع lease). الـ Edge Function تتجاهل أي
  --    صف ليس processing أو كان حجزه غير مطابق.
  v_lease := gen_random_uuid();

  UPDATE public.notification_push_outbox
  SET status          = 'processing',
      attempts        = attempts + 1,
      last_attempt_at = now(),
      last_error      = '',
      lease_id        = v_lease
  WHERE id = v_outbox;

  -- 3) الإرسال الفوري يحمل الـlease حتى تستطيع الدالة إثبات أنها الحاجزة
  PERFORM net.http_post(
    url => v_url,
    body => jsonb_build_object(
      'outbox_id', v_outbox::text,
      'lease_id',  v_lease::text
    ),
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

COMMIT;