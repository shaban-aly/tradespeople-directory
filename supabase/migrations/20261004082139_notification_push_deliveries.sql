-- ============================================================================
-- notification_push_deliveries — حالة التوصيل لكل جهاز على حدة
-- ----------------------------------------------------------------------------
-- السبب:
--   بعد 20261004082118 صار الصف الواحد = «مهمة إرسال» واحدة بنتيجة واحدة
--   مدمجة، وهو ما يمثّل صفاً واحداً لكل جهاز لكن نتيجته محسوبة كأنها نتيجة
--   واحدة. يخلق ذلك سلوكاً خاطئاً عند تعدّد الأجهزة:
--     1) جهاز نجح وآخر فشل → finish(p_sent=false) ⇒ كل السجلات «فاشلة» أو
--        «مُعاد المحاولة»، فالجهاز الذي نجح يُعاد إرساله ⇒ تكرار.
--     2) backoff واحد للإشعار كله: فشل جهاز واحد يوقف أجهزة ناجحة أخرى من
--        استلامها إن حُذف توكنها (invalid).
--   معيار الإكمال كان في الـEdge Function ⇒ سباق مع الـcron، مع أن
--   database.types لا يصف deliveries ولا يمكن لأحد قراءة الحالة من القاعدة.
--
-- القرار:
--   1) جدول جديد notification_push_deliveries: صف لكل (outbox, token).
--   2) enqueue_push_notification يولّد delivery لكل توكنات المستلم وقت الجدولة.
--   3) لكل delivery عدّاد محاولات وbackoff مستقل ⇒ فشل جهاز لا يمسّ غيره.
--   4) record_push_delivery_result تسجّل نتيجة جهاز واحد (نجاح/فشل/غير صالح).
--   5) finish_push_outbox تحسم الإكمال من القاعدة لا من الـFunction:
--      sent  ⇔ لا delivery معلّقة (كلها sent | invalid | exhausted).
--      وإلا فتبقى pending حتى موعد أقرب delivery مؤجّل.
--   6) attempts على صف outbox يبقى كمؤشّر تجميعي (رقم دورات الـworker)، ولا
--      يحدّد الفشل النهائي — الحدّه على مستوى delivery (device-scoped).
--   7) drain_stale_push_outbox يُصلح deliveries العالقة أيضاً (lease منتهٍ).
--
-- ملاحظة على التوافق: finish_push_outbox وإلا signature جديدة (lease من
-- 20261004082118) ⇒ يجب نشر هذا مع Edge Function الجديدة معاً.
--
-- Idempotent — قابلة لإعادة التطبيق.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PART 1 — جدول الـdeliveries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_push_deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id       uuid NOT NULL
                    REFERENCES public.notification_push_outbox (id) ON DELETE CASCADE,
  token_id        uuid NOT NULL
                    REFERENCES public.user_push_tokens (id) ON DELETE CASCADE,
  -- pending يشمل المؤجَّل (next_attempt_at > now()): لا حالة failed منفصلة،
  -- لأن «مؤجّل» هو Failed لكن له موعد. इस يبسّط شرط الإكمال.
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'invalid', 'exhausted')),
  attempts        integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error      text NOT NULL DEFAULT '',
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_push_deliveries_uniq UNIQUE (outbox_id, token_id)
);

COMMENT ON TABLE public.notification_push_deliveries IS
  'حالة التوصيل لكل جهاز على حدة. صف لكل (outbox, token_id). معيار اكتمال '
  'صف outbox = لا delivery بحالة pending (بما فيها المؤجّلة).';

-- claim: يجيب «ما deliveries هذا الصف المستحقة الآن؟»
CREATE INDEX IF NOT EXISTS notification_push_deliveries_due_idx
  ON public.notification_push_deliveries (outbox_id, next_attempt_at)
  WHERE status = 'pending';

-- drain: deliveries عالقة في طور إرسال انتهى lease صفها
CREATE INDEX IF NOT EXISTS notification_push_deliveries_orphan_idx
  ON public.notification_push_deliveries (next_attempt_at)
  WHERE status = 'pending';

-- ----------------------------------------------------------------------------
-- PART 2 — RLS + GRANTs (server-only، دور service_role فقط)
-- ----------------------------------------------------------------------------
ALTER TABLE public.notification_push_deliveries ENABLE ROW LEVEL SECURITY;

-- لا policies عمداً: لا قراءة ولا كتابة من anon/authenticated إطلاقاً.
-- النموذج نفسه في notification_push_outbox، و RLS مُفعّل بـ0 policies
-- فأي عميل (بما فيه service_role عبر anon key) يُرفض.
REVOKE ALL ON public.notification_push_deliveries FROM anon, authenticated, PUBLIC;
GRANT SELECT, UPDATE, DELETE ON public.notification_push_deliveries TO service_role;

-- ----------------------------------------------------------------------------
-- PART 3 — enqueue: توليد delivery لكل توكنات المستلم
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
  v_tokens integer;
BEGIN
  -- 1) تسجيل الصف داخل نفس المعاملة (يبقى حتى لو فشل الإرسال عبر الشبكة)
  INSERT INTO public.notification_push_outbox (notification_id, recipient_id)
  VALUES (NEW.id, NEW.recipient_id)
  ON CONFLICT (notification_id) DO NOTHING
  RETURNING id INTO v_outbox;

  IF v_outbox IS NULL THEN
    RETURN NEW;  -- الإشعار سبق جدولته — لا إرسال ثانٍ
  END IF;

  -- 2) صف delivery لكل توكن نشط وصالح وقت الجدولة. device cap (٤ أجهزة)
  --    مُطبَّق أصلاً في user_push_tokens، فنقرأ فقط المتاح.
  SELECT count(*) INTO v_tokens
  FROM public.user_push_tokens
  WHERE user_id = NEW.recipient_id
    AND btrim(coalesce(token, '')) <> ''
    AND token <> 'expo';

  INSERT INTO public.notification_push_deliveries (outbox_id, token_id)
  SELECT v_outbox, t.id
  FROM public.user_push_tokens t
  WHERE t.user_id = NEW.recipient_id
    AND btrim(coalesce(t.token, '')) <> ''
    AND t.token <> 'expo'
  ON CONFLICT (outbox_id, token_id) DO NOTHING;

  SELECT value INTO v_url    FROM public.push_settings WHERE key = 'push_function_url';
  SELECT value INTO v_apikey FROM public.push_settings WHERE key = 'push_apikey';
  SELECT value INTO v_secret FROM public.push_settings WHERE key = 'push_secret';

  -- لا توكنات ⇒ لا إرسال فوري؛ الصف بلا deliveries ⇒ سيُحسم عند finish.
  IF v_tokens = 0 THEN
    RETURN NEW;
  END IF;

  IF btrim(coalesce(v_url, '')) = '' OR btrim(coalesce(v_secret, '')) = '' THEN
    RETURN NEW;  -- غير مهيّأة البنية — الصف يبقى pending حتى تُضبط الإعدادات
  END IF;

  -- 3) نحجز الصف قبل الإرسال الفوري (مع lease)
  v_lease := gen_random_uuid();

  UPDATE public.notification_push_outbox
  SET status          = 'processing',
      attempts        = attempts + 1,
      last_attempt_at = now(),
      last_error      = '',
      lease_id        = v_lease
  WHERE id = v_outbox;

  -- 4) الإرسال الفوري يحمل الـlease حتى تستطيع الدالة إثبات أنها الحاجزة
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

-- ----------------------------------------------------------------------------
-- PART 4 — record_push_delivery_result: نتيجة جهاز واحد
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_push_delivery_result(
  p_outbox_id  uuid,
  p_lease_id   uuid,
  p_token_id   uuid,
  p_ok         boolean,
  p_invalid    boolean DEFAULT false,
  p_error_text text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lease uuid;
  v_max   constant integer := 6;
BEGIN
  IF p_outbox_id IS NULL OR p_lease_id IS NULL OR p_token_id IS NULL THEN
    RETURN;
  END IF;

  -- حارس الحجز: محاولة أخرى هي المسؤولة عن lifecycle هذا الصف ⇒ تجاهُل
  SELECT lease_id INTO v_lease
  FROM public.notification_push_outbox
  WHERE id = p_outbox_id AND status = 'processing';

  IF v_lease IS DISTINCT FROM p_lease_id THEN
    RETURN;
  END IF;

  -- نجاح
  IF p_ok THEN
    UPDATE public.notification_push_deliveries
    SET status     = 'sent',
        sent_at    = now(),
        last_error = ''
    WHERE outbox_id = p_outbox_id
      AND token_id  = p_token_id
      AND status    = 'pending';
    RETURN;
  END IF;

  -- توكن غير صالح (مسجّل/محذوف): يُحسم نهائياً ويُزال من الجهاز
  IF p_invalid THEN
    UPDATE public.notification_push_deliveries
    SET status     = 'invalid',
        last_error = left(coalesce(p_error_text, 'unregistered'), 500)
    WHERE outbox_id = p_outbox_id
      AND token_id  = p_token_id
      AND status    = 'pending';

    DELETE FROM public.user_push_tokens WHERE id = p_token_id;
    RETURN;
  END IF;

  -- فشل مؤقّت: backoff مستقل على هذا الجهاز فقط، ولا يمسّ أجهزة أخرى.
  UPDATE public.notification_push_deliveries
  SET attempts        = attempts + 1,
      status          = CASE WHEN attempts + 1 >= v_max THEN 'exhausted' ELSE 'pending' END,
      next_attempt_at = CASE
        WHEN attempts + 1 >= v_max THEN next_attempt_at
        ELSE now() + (interval '1 minute' * (2 ^ GREATEST(attempts, 0)))
      END,
      last_error = left(coalesce(p_error_text, 'unknown error'), 500)
  WHERE outbox_id = p_outbox_id
    AND token_id  = p_token_id
    AND status    = 'pending';
END;
$function$;

REVOKE ALL ON FUNCTION public.record_push_delivery_result(uuid, uuid, uuid, boolean, boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_push_delivery_result(uuid, uuid, uuid, boolean, boolean, text)
  TO service_role;

-- ----------------------------------------------------------------------------
-- PART 5 — finish: معيار الإكمال في القاعدة
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
  v_lease   uuid;
  v_pending integer;
  v_soonest timestamptz;
BEGIN
  IF p_outbox_id IS NULL OR p_lease_id IS NULL THEN RETURN; END IF;

  -- حارس الحجز: صف حجزته محاولة أحدث ⇒ تجاهُل صامت (لا فشل، لا backoff)
  SELECT lease_id INTO v_lease
  FROM public.notification_push_outbox
  WHERE id = p_outbox_id AND status = 'processing';

  IF v_lease IS DISTINCT FROM p_lease_id THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_pending
  FROM public.notification_push_deliveries
  WHERE outbox_id = p_outbox_id AND status = 'pending';

  -- اكتمل: كل الأجهزة sent | invalid | exhausted
  IF v_pending = 0 THEN
    UPDATE public.notification_push_outbox
    SET status     = 'sent',
        sent_at    = now(),
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
-- PART 6 — drain: deliveries عالقة في طور إرسال انتهى lease صفها
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.drain_stale_push_outbox()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE public.notification_push_deliveries d
  SET next_attempt_at = now()
  FROM public.notification_push_outbox o
  WHERE d.outbox_id = o.id
    AND d.status = 'pending'
    AND o.status = 'processing'
    AND o.last_attempt_at < now() - interval '10 minutes';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.notification_push_outbox
  SET status          = 'pending',
      next_attempt_at = now(),
      last_error      = 'stale lease: processing تجاوز 10 دقائق بلا finish',
      lease_id        = NULL
  WHERE status = 'processing'
    AND last_attempt_at < now() - interval '10 minutes';

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.drain_stale_push_outbox() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.drain_stale_push_outbox() TO service_role;

COMMIT;