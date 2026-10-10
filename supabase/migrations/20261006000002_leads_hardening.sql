-- =============================================================================
-- 20261006000002_leads_hardening
-- تقوية نظام الطلبات المفتوحة (leads):
--   1) قيود صحة البيانات (طول الوصف + صيغة الهاتف) — NOT VALID لعدم كسر صفوف قديمة.
--   2) خصوصية رقم العميل: سحب SELECT على customer_phone من authenticated؛
--      الصنايعي لا يرى الرقم إلا بعد الاستلام عبر get_my_claimed_leads().
--   3) حد إنشاء (5 طلبات / 24 ساعة لكل عميل) لمنع إغراق الصنايعية بالإشعارات.
--   4) claim_lead: يتحقق من أن الصنايعي approved ومن نفس تخصص الطلب، ويمنع
--      العميل من استلام طلبه، ويسحب EXECUTE من anon.
--   5) فهارس للاستعلامات الفعلية.
-- =============================================================================

BEGIN;

-- 1) قيود صحة البيانات ----------------------------------------------------------
ALTER TABLE public.leads
  ADD CONSTRAINT leads_description_length
  CHECK (char_length(btrim(description)) BETWEEN 10 AND 1000) NOT VALID;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_customer_phone_format
  CHECK (customer_phone ~ '^\+?[0-9]{10,15}$') NOT VALID;

-- 2) خصوصية رقم العميل -----------------------------------------------------------
-- RLS لا تحجب أعمدة؛ نستخدم صلاحيات الأعمدة. INSERT يبقى كما هو.
REVOKE SELECT ON public.leads FROM anon, authenticated;
GRANT SELECT (id, customer_id, category_id, area_id, description, status, created_at, claimed_at)
  ON public.leads TO authenticated;

-- الطلبات التي استلمها الصنايعي الحالي مع رقم العميل (لأصحاب الطلب المستلَم فقط)
CREATE OR REPLACE FUNCTION public.get_my_claimed_leads()
RETURNS TABLE (
  lead_id        uuid,
  description    text,
  customer_phone text,
  status         text,
  created_at     timestamptz,
  claimed_at     timestamptz,
  category_name  text,
  area_name      text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (l.id)
    l.id,
    l.description,
    l.customer_phone::text,
    l.status,
    l.created_at,
    lr.created_at,
    c.name,
    a.name
  FROM public.lead_responses lr
  JOIN public.craftsmen cr ON cr.id = lr.craftsman_id
  JOIN public.leads l      ON l.id = lr.lead_id
  LEFT JOIN public.categories c ON c.id = l.category_id
  LEFT JOIN public.areas a      ON a.id = l.area_id
  WHERE cr.owner_user_id = auth.uid()
    AND auth.uid() IS NOT NULL
  ORDER BY l.id, lr.created_at DESC
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.get_my_claimed_leads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_claimed_leads() TO authenticated;

-- 3) حد إنشاء الطلبات --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_lead_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_recent int;
BEGIN
  SELECT count(*) INTO v_recent
  FROM public.leads
  WHERE customer_id = NEW.customer_id
    AND created_at > now() - interval '24 hours';

  IF v_recent >= 5 THEN
    RAISE EXCEPTION 'lead_rate_limited' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_lead_rate_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS leads_rate_limit ON public.leads;
CREATE TRIGGER leads_rate_limit
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_lead_rate_limit();

-- 4) claim_lead أكثر صرامة ---------------------------------------------------------
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
  v_owner           UUID;
  v_cr_category     UUID;
  v_cr_status       TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT owner_user_id, category_id, status
    INTO v_owner, v_cr_category, v_cr_status
  FROM public.craftsmen
  WHERE id = p_craftsman_id;

  IF v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this craftsman profile.';
  END IF;

  IF v_cr_status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'Unauthorized: craftsman profile is not approved.';
  END IF;

  -- قفل صف الطلب لمنع السباق على المقاعد الثلاثة
  SELECT status, customer_id, category_id
    INTO v_status, v_customer_id, v_lead_category
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found.';
  END IF;

  IF v_lead_category IS DISTINCT FROM v_cr_category THEN
    RAISE EXCEPTION 'Unauthorized: category mismatch.';
  END IF;

  IF v_customer_id = auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot claim own lead.';
  END IF;

  -- رد سابق من نفس الصنايعي = نجاح بلا تكرار إشعار
  IF EXISTS (
    SELECT 1 FROM public.lead_responses
    WHERE lead_id = p_lead_id AND craftsman_id = p_craftsman_id
  ) THEN
    RETURN TRUE;
  END IF;

  IF v_status <> 'open' THEN
    RETURN FALSE;
  END IF;

  SELECT count(*) INTO v_responses_count
  FROM public.lead_responses WHERE lead_id = p_lead_id;

  IF v_responses_count >= 3 THEN
    UPDATE public.leads SET status = 'claimed', claimed_at = now() WHERE id = p_lead_id;
    RETURN FALSE;
  END IF;

  INSERT INTO public.lead_responses (lead_id, craftsman_id)
  VALUES (p_lead_id, p_craftsman_id);

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

-- دالة الـ trigger لا تُستدعى مباشرة
REVOKE ALL ON FUNCTION public.notify_craftsmen_on_new_lead() FROM PUBLIC, anon, authenticated;

-- 5) كسر تداخل RLS بين leads و lead_responses ---------------------------------------
-- سياسة leads كانت تستعلم lead_responses وسياستها تستعلم leads → infinite recursion.
CREATE OR REPLACE FUNCTION public.is_lead_customer(p_lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = p_lead_id AND customer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_responded_to_lead(p_lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lead_responses lr
    JOIN public.craftsmen cr ON cr.id = lr.craftsman_id
    WHERE lr.lead_id = p_lead_id AND cr.owner_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_lead_customer(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_responded_to_lead(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_lead_customer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_responded_to_lead(uuid) TO authenticated;

DROP POLICY IF EXISTS "craftsmen_view_claimed_leads" ON public.leads;
CREATE POLICY "craftsmen_view_claimed_leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_responded_to_lead(id));

DROP POLICY IF EXISTS "customers_view_lead_responses" ON public.lead_responses;
CREATE POLICY "customers_view_lead_responses" ON public.lead_responses
  FOR SELECT TO authenticated
  USING (public.is_lead_customer(lead_id));

-- 6) فهارس -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS leads_category_status_created_idx
  ON public.leads (category_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_customer_created_idx
  ON public.leads (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_responses_craftsman_idx
  ON public.lead_responses (craftsman_id);

COMMIT;
