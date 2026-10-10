-- 20261006000009_craftsmen_published_enforcement.sql
-- Enforce that ONLY published craftsmen can view open leads and claim them.

-- 1. Update craftsmen_view_open_leads policy
DROP POLICY IF EXISTS "craftsmen_view_open_leads" ON public.leads;
CREATE POLICY "craftsmen_view_open_leads" ON public.leads
    FOR SELECT TO authenticated
    USING (
        status = 'open' AND
        hidden = false AND
        category_id IN (
            SELECT category_id FROM public.craftsmen 
            WHERE owner_user_id = auth.uid() 
            AND status = 'approved'
            AND is_published = true
        )
    );

-- 2. Update claim_lead RPC to enforce is_published
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
  v_is_published    BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT owner_user_id, category_id, status, is_published
    INTO v_owner, v_cr_category, v_cr_status, v_is_published
  FROM public.craftsmen
  WHERE id = p_craftsman_id;

  IF v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this craftsman profile.';
  END IF;

  IF v_cr_status IS DISTINCT FROM 'approved' OR NOT v_is_published THEN
    RAISE EXCEPTION 'Unauthorized: craftsman profile must be approved and published.';
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
