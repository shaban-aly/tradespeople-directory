-- ============================================================================
-- notification_internal_link_guard — قبول الروابط الداخلية فقط في بث الإدارة
-- ----------------------------------------------------------------------------
-- السبب:
--   broadcast_admin_notification كانت تكتب p_link كما ورد في metadata.link بلا
--   أي تحقق من شكله. وmetadata.link يُستخدم لاحقاً في موضعين:
--     1) href في next/link داخل الجرس وصفحة الإشعارات.
--     2) رابط نقرة FCM (defaultLinkResolver في send-push/lib.ts).
--   أي قيمة مثل //evil.example أو javascript:alert(1) أو http://… كانت تُخزَّن
--   في القاعدة وتُعاد كأمر قابل للتنفيذ أو للتحويل خارجي.
--
-- القرار:
--   1) دالة تحقق مشتركة في القاعدة is_safe_internal_link(text) تطلب:
--      - قيمة غير فارغة وطول ≤ 500
--      - تبدأ بـ '/' واحد
--      - لا تبدأ بـ '//' (رابط protocol-relative ⇒ تحويل خارجي)
--      - لا تحتوي ':' قبل أول '?' أو '#' (يمنع javascript:/data:/http:/tel:/mailto: …)
--      - لا تحتوي محارف تحكم أو مسافات بيضاء أو backslash
--   2) broadcast_admin_notification ترفض أي رابط غير صالح (RAISE EXCEPTION)
--      بدل تخزينه — لأن الرفض صريح أفضل من تخزين رابط ثم تجاهله لاحقاً.
--   3) الصفوف القديمة التي قد تحوي رابطاً غير صالح لا تُمسح ولا تُعدَّل (منع
--      إتلاف بيانات تاريخية)، بل تُرشَّح عند القراءة في ثلاث نقاط معاً:
--      طبقة العرض (lib/utils/internalLink.ts)، و FCM resolver، و Service Worker.
--   4) idempotent.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1 — دالة التحقق (نقية، بلا حالة)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_safe_internal_link(p_link text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_path text;
BEGIN
  IF p_link IS NULL THEN RETURN false; END IF;
  IF char_length(p_link) < 1 OR char_length(p_link) > 500 THEN RETURN false; END IF;

  -- يجب أن يبدأ بـ '/' واحد بالضبط (لا '//' ولا رابط مطلق)
  IF left(p_link, 1) <> '/' THEN RETURN false; END IF;
  IF left(p_link, 2) = '//' THEN RETURN false; END IF;

  -- ممنوع: محارف تحكم، مسافة، backslash (محارف تحكّم/تشويش)
  IF p_link ~ '[[:cntrl:]\s\\]' THEN RETURN false; END IF;

  -- ممنوع أي protocol-relative أو مخطط قبل أول '?' أو '#'
  -- (يمنع javascript: / data: / http: / https: / tel: / mailto: …)
  v_path := split_part(split_part(p_link, '?', 1), '#', 1);
  IF position(':' IN v_path) > 0 THEN RETURN false; END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.is_safe_internal_link(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_safe_internal_link(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_safe_internal_link(text) TO authenticated;

-- ============================================================================
-- PART 2 — تشديد broadcast_admin_notification
-- ============================================================================
CREATE OR REPLACE FUNCTION public.broadcast_admin_notification(
  p_title    text,
  p_body     text,
  p_link     text  DEFAULT NULL,
  p_audience text  DEFAULT 'all',
  p_user_id  uuid  DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count    integer := 0;
  v_metadata jsonb;
BEGIN
  -- تحقق الدور (auth.uid() يعمل لأن client يحمل الجلسة عبر cookies)
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- تحقق المدخلات
  IF p_title IS NULL OR char_length(p_title) < 2 OR char_length(p_title) > 200 THEN
    RAISE EXCEPTION 'invalid title';
  END IF;
  IF p_body IS NULL OR char_length(p_body) < 2 OR char_length(p_body) > 1000 THEN
    RAISE EXCEPTION 'invalid body';
  END IF;
  IF p_audience NOT IN ('all', 'craftsmen', 'clients', 'user_id') THEN
    RAISE EXCEPTION 'invalid audience';
  END IF;
  IF p_audience = 'user_id' AND p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  -- الرابط إما NULL أو رابط داخلي آمن فقط (يرفض // و javascript: و http: …)
  IF p_link IS NOT NULL AND NOT public.is_safe_internal_link(p_link) THEN
    RAISE EXCEPTION 'link must be an internal path starting with a single "/"';
  END IF;

  -- بناء metadata
  v_metadata := jsonb_build_object('sent_by', auth.uid(), 'audience', p_audience);
  IF p_link IS NOT NULL THEN
    v_metadata := v_metadata || jsonb_build_object('link', p_link);
  END IF;

  -- الإرسال حسب الجمهور
  IF p_audience = 'user_id' THEN
    PERFORM public.create_notification(
      p_user_id,
      'admin_broadcast',
      p_title,
      p_body,
      v_metadata,
      'broadcast:' || p_user_id::text || ':' || gen_random_uuid()::text
    );
    v_count := 1;
  ELSE
    INSERT INTO public.notifications (recipient_id, type, title, body, key, metadata)
    SELECT
      p.id,
      'admin_broadcast',
      p_title,
      p_body,
      'broadcast:' || p.id::text || ':' || gen_random_uuid()::text,
      v_metadata
    FROM public.profiles p
    WHERE
      CASE p_audience
        WHEN 'all'       THEN p.role IN ('client', 'craftsman')
        WHEN 'craftsmen' THEN p.role = 'craftsman'
        WHEN 'clients'   THEN p.role = 'client'
      END
    ON CONFLICT (key) DO NOTHING;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN v_count;
END;
$$;

-- EXECUTE لـ authenticated فقط (is_admin() يحمي داخلياً)
REVOKE ALL ON FUNCTION public.broadcast_admin_notification(text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.broadcast_admin_notification(text, text, text, text, uuid) TO authenticated;

COMMIT;
