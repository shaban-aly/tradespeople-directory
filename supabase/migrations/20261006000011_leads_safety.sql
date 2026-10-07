-- =============================================================================
-- 20261006000011_leads_safety
-- تقوية سلامة نظام الطلبات (P0):
--   1) سرية customer_phone: سحب SELECT الكامل (أعاده 0005) ومنح أعمدة محددة
--      بدون customer_phone (نمط 0002) — الرقم يُقرأ فقط عبر get_my_claimed_leads.
--   2) إغلاق الإدراج المباشر في lead_responses (سحب سياسة INSERT) — RPC فقط.
--   3) trigger حارس guard_lead_response على INSERT: يقفل صف الطلب ويفحص
--      (open + غير مخفي + غير منتهٍ + صانع معتمد ومنشور + تطابق التخصص + < 3).
--   4) claim_lead v4: فحص hidden/expires_at، الرد المكرر بعد الإغلاق = خطأ
--      صريح، وأسباب فشل مميزة برموز LEAD_CLAIM_* بدل FALSE/TRUE المضلِّلَين.
--   5) فلترة is_published في إشعار الطلبات الجديدة (لا إشعار لغير المنشور).
-- =============================================================================

BEGIN;

-- 1) سرية رقم العميل -----------------------------------------------------------
-- RLS لا تحجب أعمدة؛ نستخدم صلاحيات الأعمدة. INSERT/UPDATE/DELETE كما هي.
REVOKE SELECT ON public.leads FROM anon, authenticated;
GRANT SELECT (id, customer_id, category_id, area_id, description, status,
  created_at, claimed_at, updated_at, expires_at, hidden)
  ON public.leads TO authenticated;

-- 2) + 3) حارس الردود ----------------------------------------------------------
DROP POLICY IF EXISTS "lead_responses craftsman insert" ON public.lead_responses;

CREATE OR REPLACE FUNCTION public.guard_lead_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status        TEXT;
  v_hidden        BOOLEAN;
  v_expires       TIMESTAMPTZ;
  v_lead_category UUID;
  v_count         INT;
  v_cr_status     TEXT;
  v_cr_published  BOOLEAN;
  v_cr_category   UUID;
BEGIN
  -- قفل صف الطلب لتسلسل الإدراجات المتزامنة على نفس الطلب
  SELECT status, hidden, expires_at, category_id
    INTO v_status, v_hidden, v_expires, v_lead_category
  FROM public.leads
  WHERE id = NEW.lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  IF v_status <> 'open' THEN
    RAISE EXCEPTION 'Lead is not open';
  END IF;
  IF v_hidden THEN
    RAISE EXCEPTION 'Lead is hidden';
  END IF;
  IF v_expires <= now() THEN
    RAISE EXCEPTION 'Lead expired';
  END IF;

  SELECT status, is_published, category_id
    INTO v_cr_status, v_cr_published, v_cr_category
  FROM public.craftsmen
  WHERE id = NEW.craftsman_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Craftsman not found';
  END IF;
  IF v_cr_status IS DISTINCT FROM 'approved' OR NOT v_cr_published THEN
    RAISE EXCEPTION 'Craftsman profile must be approved and published';
  END IF;
  IF v_cr_category IS DISTINCT FROM v_lead_category THEN
    RAISE EXCEPTION 'Category mismatch';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.lead_responses
  WHERE lead_id = NEW.lead_id;

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Lead is full';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_lead_response() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS lead_responses_guard_trigger ON public.lead_responses;
CREATE TRIGGER lead_responses_guard_trigger
  BEFORE INSERT ON public.lead_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_lead_response();

-- 4) claim_lead v4 --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_lead(p_lead_id UUID, p_craftsman_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_responses_count INT;
  v_status          TEXT;
  v_customer_id     UUID;
  v_lead_category   UUID;
  v_hidden          BOOLEAN;
  v_expires         TIMESTAMPTZ;
  v_owner           UUID;
  v_cr_category     UUID;
  v_cr_status       TEXT;
  v_cr_published    BOOLEAN;
  v_already         BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT owner_user_id, category_id, status, is_published
    INTO v_owner, v_cr_category, v_cr_status, v_cr_published
  FROM public.craftsmen
  WHERE id = p_craftsman_id;

  IF v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this craftsman profile.';
  END IF;

  IF v_cr_status IS DISTINCT FROM 'approved' OR NOT v_cr_published THEN
    RAISE EXCEPTION 'LEAD_CLAIM_UNPUBLISHED: حسابك الفني غير منشور أو غير معتمد.';
  END IF;

  -- قفل صف الطلب لمنع السباق على المقاعد الثلاثة
  SELECT status, customer_id, category_id, hidden, expires_at
    INTO v_status, v_customer_id, v_lead_category, v_hidden, v_expires
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.lead_responses
    WHERE lead_id = p_lead_id AND craftsman_id = p_craftsman_id
  ) INTO v_already;

  -- رد مكرر على طلب ما زال مفتوحاً = نجاح بلا تكرار إشعار
  IF v_already AND v_status = 'open' THEN
    RETURN TRUE;
  END IF;

  IF v_status <> 'open' THEN
    RAISE EXCEPTION 'LEAD_CLAIM_CLOSED: هذا الطلب أُغلق (ملغى أو منتهي أو مكتمل).';
  END IF;

  IF v_hidden THEN
    RAISE EXCEPTION 'LEAD_CLAIM_HIDDEN: هذا الطلب مخفي إدارياً.';
  END IF;

  IF v_expires <= now() THEN
    RAISE EXCEPTION 'LEAD_CLAIM_EXPIRED: انتهت صلاحية هذا الطلب.';
  END IF;

  IF v_lead_category IS DISTINCT FROM v_cr_category THEN
    RAISE EXCEPTION 'Unauthorized: category mismatch.';
  END IF;

  IF v_customer_id = auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot claim own lead.';
  END IF;

  SELECT count(*) INTO v_responses_count
  FROM public.lead_responses WHERE lead_id = p_lead_id;

  IF v_responses_count >= 3 THEN
    UPDATE public.leads SET status = 'claimed', claimed_at = now() WHERE id = p_lead_id;
    RETURN FALSE;
  END IF;

  BEGIN
    INSERT INTO public.lead_responses (lead_id, craftsman_id)
    VALUES (p_lead_id, p_craftsman_id);
  EXCEPTION WHEN unique_violation THEN
    -- سباق نادر بعد فحص v_already: الرد موجود والطلب مفتوح = نجاح
    RETURN TRUE;
  END;

  IF (v_responses_count + 1) >= 3 THEN
    UPDATE public.leads SET status = 'claimed', claimed_at = now() WHERE id = p_lead_id;
  END IF;

  PERFORM public.create_notification(
    v_customer_id,
    'lead_claimed',
    'صنايعي متاح لطلبك 👷',
    'هناك فني جديد وافق على طلبك ومستعد للعمل، ادخل لترى التفاصيل!',
    jsonb_build_object('lead_id', p_lead_id, 'link', '/profile/requests')
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_lead(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_lead(UUID, UUID) TO authenticated;

-- 5) لا إشعار «طلب جديد» لصنايعي غير منشور --------------------------------------
CREATE OR REPLACE FUNCTION public.notify_craftsmen_on_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_craftsman RECORD;
    v_admin RECORD;
    v_category_name TEXT;
    v_area_name TEXT;
BEGIN
    SELECT name INTO v_category_name FROM public.categories WHERE id = NEW.category_id;
    SELECT name INTO v_area_name FROM public.areas WHERE id = NEW.area_id;

    -- إشعار الصنايعية (المعتمدين والمنشورين فقط)
    FOR v_craftsman IN
        SELECT DISTINCT owner_user_id
        FROM public.craftsmen
        WHERE category_id = NEW.category_id
        AND status = 'approved'
        AND is_published = true
        AND owner_user_id IS NOT NULL
        -- لمنع إرسال إشعار للعميل نفسه إذا كان لديه حساب صنايعي
        AND owner_user_id IS DISTINCT FROM NEW.customer_id
    LOOP
        PERFORM public.create_notification(
            v_craftsman.owner_user_id,
            'lead_new',
            'طلب عمل جديد متاح 🚨',
            'مطلوب ' || v_category_name || ' في ' || v_area_name || ' الآن! اضغط للتفاصيل.',
            jsonb_build_object('lead_id', NEW.id, 'link', '/dashboard/leads')
        );
    END LOOP;

    -- إشعار المشرفين
    FOR v_admin IN
        SELECT id FROM public.profiles WHERE role = 'admin'
    LOOP
        PERFORM public.create_notification(
            v_admin.id,
            'admin_alert',
            'طلب خدمة جديد 🆕',
            'تم إنشاء طلب خدمة جديد (' || v_category_name || ') في ' || v_area_name,
            jsonb_build_object('lead_id', NEW.id, 'link', '/admin/leads')
        );
    END LOOP;

    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_craftsmen_on_new_lead() FROM PUBLIC, anon, authenticated;

COMMIT;
