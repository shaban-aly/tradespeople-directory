-- ============================================================================
-- notifications_mark_all_read — "تعليم الكل كمقروء" كعملية حقيقية داخل القاعدة
-- ----------------------------------------------------------------------------
-- السبب:
--   الواجهة كانت ترسل أول 200 معرف من Loaded items إلى mark_notifications_read،
--   ومع وجود أكثر من 200 إشعار غير مقروء يبقى الباقي غير مقروء بصمت بينما
--   الواجهة تعلن العدّاد صفراً (حالة تضليل). كما أن أي فشل في الجلب كان يُحوَّل
--   إلى []/0 فتفرغ الشاشة بلا سبب واضح.
--
-- القرارات:
--   1) RPC جديدة mark_all_notifications_read() بلا مدخلات — المصدر الوحيد للقرار
--      هو auth.uid() داخل القاعدة، فلا يمكن للعميل أن يوسّع النطاق.
--   2) SECURITY DEFINER + search_path مثبّت + REVOKE من PUBLIC و anon
--      + GRANT EXECUTE لـ authenticated فقط (كما بقية دوال الهوية).
--   3) اتجاه واحد: read_at IS NULL فقط — لا إعادة تعليم المقروء غير مقروء.
--   4) تُعيد عدد الصفوف الفعلية المحدَّثة ليُستخدم كقيمة موثوقة للعدّاد
--      بدل القيمة المتفائلة.
--   5) فهرس جزئي على (recipient_id) WHERE read_at IS NULL يخدم العدّاد
--      (head countExact) والتحديث الجماعي معاً بدل مسح كل إشعارات المستخدم.
--
-- mark_notifications_read(uuid[]) تبقى كما هي ومفيدة لقراءة عنصر واحد أو
-- مجموعة محددة مسبقاً (حتى 200 معرف).
--
-- Idempotent — قابلة لإعادة التطبيق.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PART 1 — فهرس جزئي للغير المقروء (يخدم العدّاد + تعليم الكل)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
  ON public.notifications (recipient_id)
  WHERE read_at IS NULL;

-- ----------------------------------------------------------------------------
-- PART 2 — mark_all_notifications_read
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
  v_user  uuid;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.notifications
  SET read_at = now()
  WHERE recipient_id = v_user
    AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- بلا EXECUTE عام — authenticated فقط (الملكية مثبّتة عبر auth.uid() داخل الجسم).
REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

COMMIT;
