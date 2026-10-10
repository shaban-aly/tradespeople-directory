-- =============================================================================
-- 20261006000012_leads_lifecycle_notifications
-- إغلاق دورة الحياة (P1):
--   1) أنواع إشعارات جديدة: lead_completed, lead_cancelled, lead_expired,
--      lead_withdrawn, lead_renewed.
--   2) guard_lead_status_transition: استثناءات مقيّدة —
--      (claimed ⇒ cancelled بواسطة المالك)، (claimed ⇒ open عند نزول الردود
--      تحت 3 بعد سحب رد)، (expired ⇒ open عند تجديد بـ expires_at أحدث).
--   3) cancel_lead: العميل يلغي من open|claimed مع إشعار الردّاء.
--   4) renew_lead: العميل يجدد منتهياً ⇒ open بـ expires_at = now()+24h
--      مع إعادة إشعار الصنايعية.
--   5) withdraw_lead_response: الصنايعي يسحب ردّه من open|claimed
--      مع إشعار العميل وإعادة فتح المقعد.
--   6) complete_lead يُشعِر الصنايعية الردّاء بالإنجاز.
--   7) expire_stale_leads يُشعِر الصنايعية الردّاء بانتهاء الصلاحية.
-- =============================================================================

BEGIN;

-- 1) قيد أنواع الإشعارات ---------------------------------------------------------
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
        'join_approved',
        'join_rejected',
        'verified',
        'published',
        'account_linked',
        'review_added',
        'report_status',
        'new_request',
        'new_report',
        'new_message',
        'new_craftsman',
        'welcome',
        'admin_alert',
        'admin_broadcast',
        'lead_new',
        'lead_claimed',
        'lead_completed',
        'lead_cancelled',
        'lead_expired',
        'lead_withdrawn',
        'lead_renewed',
        'lead_removed'
    )
);

-- 2) guard: استثناءات مقيّدة ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_lead_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_responses_count INT;
BEGIN
  -- تحديث وقت التعديل
  NEW.updated_at = now();

  IF TG_OP = 'UPDATE' THEN
    -- إذا تم تعديل الوصف أو الهاتف
    IF NEW.description IS DISTINCT FROM OLD.description OR NEW.customer_phone IS DISTINCT FROM OLD.customer_phone THEN
      IF OLD.status != 'open' THEN
        RAISE EXCEPTION 'Cannot edit lead unless it is open';
      END IF;

      SELECT count(*) INTO v_responses_count FROM public.lead_responses WHERE lead_id = NEW.id;
      IF v_responses_count > 0 THEN
        RAISE EXCEPTION 'Cannot edit lead after it has responses';
      END IF;
    END IF;

    -- التحقق من انتقال الحالة
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      -- إعادة فتح بعد سحب رد (claimed ⇒ open): فقط إذا نزلت الردود تحت 3 فعلياً
      IF OLD.status = 'claimed' AND NEW.status = 'open' THEN
        SELECT count(*) INTO v_responses_count FROM public.lead_responses WHERE lead_id = NEW.id;
        IF v_responses_count >= 3 THEN
          RAISE EXCEPTION 'Claimed leads with full responses cannot reopen';
        END IF;
        RETURN NEW;
      END IF;

      -- تجديد طلب منتهٍ (expired ⇒ open): فقط بـ expires_at أحدث من الحالي
      IF OLD.status = 'expired' AND NEW.status = 'open' THEN
        IF NEW.expires_at IS NOT DISTINCT FROM OLD.expires_at THEN
          RAISE EXCEPTION 'Renewing requires a new expires_at';
        END IF;
        RETURN NEW;
      END IF;

      IF OLD.status IN ('completed', 'cancelled', 'expired') THEN
        RAISE EXCEPTION 'Cannot change status from %', OLD.status;
      END IF;
      IF OLD.status = 'claimed' AND NEW.status NOT IN ('completed', 'cancelled', 'open') THEN
        RAISE EXCEPTION 'Claimed leads can only be completed, cancelled by owner, or reopened after withdrawal';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) إلغاء العميل (من open أو claimed) --------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_lead(p_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_responder RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.leads
  SET status = 'cancelled'
  WHERE id = p_lead_id AND customer_id = auth.uid() AND status IN ('open', 'claimed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found, not owned by you, or already closed';
  END IF;

  -- إشعار الصنايعية الذين ردّوا
  FOR v_responder IN
    SELECT DISTINCT cr.owner_user_id
    FROM public.lead_responses lr
    JOIN public.craftsmen cr ON cr.id = lr.craftsman_id
    WHERE lr.lead_id = p_lead_id AND cr.owner_user_id IS NOT NULL
  LOOP
    PERFORM public.create_notification(
      v_responder.owner_user_id,
      'lead_cancelled',
      'أُلغي طلب كان متاحاً لديك',
      'قام العميل بإلغاء الطلب، لذلك لن تحتاج للتواصل معه.',
      jsonb_build_object('lead_id', p_lead_id, 'link', '/dashboard/leads')
    );
  END LOOP;

  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_lead(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_lead(UUID) TO authenticated;

-- 4) تجديد الطلب المنتهي ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.renew_lead(p_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_category_id UUID;
  v_area_id     UUID;
  v_description TEXT;
  v_customer    UUID;
  v_craftsman   RECORD;
  v_category_name TEXT;
  v_area_name     TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT customer_id, category_id, area_id, description
    INTO v_customer, v_category_id, v_area_id, v_description
  FROM public.leads
  WHERE id = p_lead_id AND customer_id = auth.uid() AND status = 'expired'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found, not owned by you, or not expired';
  END IF;

  UPDATE public.leads
  SET status = 'open', expires_at = now() + interval '24 hours'
  WHERE id = p_lead_id;

  -- إعادة إشعار الصنايعية المعتمدين والمنشورين في نفس التخصص
  SELECT name INTO v_category_name FROM public.categories WHERE id = v_category_id;
  SELECT name INTO v_area_name FROM public.areas WHERE id = v_area_id;

  FOR v_craftsman IN
    SELECT DISTINCT owner_user_id
    FROM public.craftsmen
    WHERE category_id = v_category_id
    AND status = 'approved'
    AND is_published = true
    AND owner_user_id IS NOT NULL
    AND owner_user_id IS DISTINCT FROM v_customer
  LOOP
    PERFORM public.create_notification(
      v_craftsman.owner_user_id,
      'lead_renewed',
      'طلب مُجدَّد متاح 🚨',
      'عاد طلب «' || left(v_description, 60) || '…» متاحاً مجدداً في ' || v_area_name || '.',
      jsonb_build_object('lead_id', p_lead_id, 'link', '/dashboard/leads')
    );
  END LOOP;

  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.renew_lead(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.renew_lead(UUID) TO authenticated;

-- 5) سحب رد الصنايعي ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.withdraw_lead_response(p_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead_status TEXT;
  v_customer    UUID;
  v_removed     BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT status, customer_id INTO v_lead_status, v_customer
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found.';
  END IF;

  IF v_lead_status NOT IN ('open', 'claimed') THEN
    RAISE EXCEPTION 'LEAD_WITHDRAW_CLOSED: لا يمكن السحب — الطلب أُغلق بالفعل.';
  END IF;

  DELETE FROM public.lead_responses lr
  USING public.craftsmen cr
  WHERE lr.craftsman_id = cr.id
    AND cr.owner_user_id = auth.uid()
    AND lr.lead_id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No response found to withdraw.';
  END IF;
  v_removed := true;

  -- إعادة فتح المقاعد عند نزول الردود تحت 3 (الـ guard يسمح claimed ⇒ open هنا)
  IF v_lead_status = 'claimed' THEN
    UPDATE public.leads SET status = 'open', claimed_at = NULL
    WHERE id = p_lead_id AND (SELECT count(*) FROM public.lead_responses WHERE lead_id = p_lead_id) < 3;
  END IF;

  PERFORM public.create_notification(
    v_customer,
    'lead_withdrawn',
    'سحب أحد الصنايعية عرضه',
    'أحد الفنيين الذي وافق على طلبك سحب استلامه، تبقّى على باقي الفنيين الرد.',
    jsonb_build_object('lead_id', p_lead_id, 'link', '/profile/requests')
  );

  RETURN v_removed;
END;
$$;
REVOKE ALL ON FUNCTION public.withdraw_lead_response(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_lead_response(UUID) TO authenticated;

-- 6) complete_lead يُشعِر الردّاء ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_lead(p_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_responder RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.leads
  SET status = 'completed'
  WHERE id = p_lead_id AND customer_id = auth.uid() AND status IN ('claimed', 'open');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found, not owned by you, or not in open/claimed state';
  END IF;

  FOR v_responder IN
    SELECT DISTINCT cr.owner_user_id
    FROM public.lead_responses lr
    JOIN public.craftsmen cr ON cr.id = lr.craftsman_id
    WHERE lr.lead_id = p_lead_id AND cr.owner_user_id IS NOT NULL
  LOOP
    PERFORM public.create_notification(
      v_responder.owner_user_id,
      'lead_completed',
      'تم إنجاز العمل ✅',
      'أكمل العميل الطلب الذي استلمته. لا تنسَ متابعة تقييماتك!',
      jsonb_build_object('lead_id', p_lead_id, 'link', '/dashboard/leads')
    );
  END LOOP;

  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_lead(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_lead(UUID) TO authenticated;

-- 7) expire_stale_leads يُشعِر الردّاء --------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_stale_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead RECORD;
  v_responder RECORD;
BEGIN
  FOR v_lead IN
    UPDATE public.leads
    SET status = 'expired'
    WHERE status = 'open' AND expires_at < now()
    RETURNING id
  LOOP
    FOR v_responder IN
      SELECT DISTINCT cr.owner_user_id
      FROM public.lead_responses lr
      JOIN public.craftsmen cr ON cr.id = lr.craftsman_id
      WHERE lr.lead_id = v_lead.id AND cr.owner_user_id IS NOT NULL
    LOOP
      PERFORM public.create_notification(
        v_responder.owner_user_id,
        'lead_expired',
        'انتهت صلاحية طلب استلمته',
        'مرّت 24 ساعة على طلب العميل دون إتمام، لذلك انتهت صلاحيته.',
        jsonb_build_object('lead_id', v_lead.id, 'link', '/dashboard/leads')
      );
    END LOOP;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_stale_leads() FROM PUBLIC, anon, authenticated;

COMMIT;
