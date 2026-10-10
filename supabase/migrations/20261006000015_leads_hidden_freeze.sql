-- =============================================================================
-- 20261006000015_leads_hidden_freeze (P1)
-- تجميد الطلب المخفي إدارياً: لا أفعال للمالك/الصنايعي على `hidden=true`
-- حتى يفكّ المشرف الإخفاء (قرار P1 المثبت).
--   1) `customers_update_own_open_lead`: قيد `hidden=false` في USING وWITH CHECK
--      (المسار المباشر — دفاع مع الفحص الصريح في getOwnEditableLead).
--   2) حارس `guard_lead_hidden_freeze` (BEFORE UPDATE): أي UPDATE على صف
--      مخفي من جلسة غير مشرف (auth.uid() حاضر) يُرفض — يغطي المسار المباشر
--      وكل RPCs المالك دفعة واحدة (cancel/complete/renew). النظام (cron بلا
--      uid) والمشرف (is_admin) مستثنيان: انتهاء الصلاحية وفكّ الإخفاء يعملان.
--   3) `withdraw_lead_response`: فحص صريح (السحب يحذف من lead_responses وقد
--      لا يلمس leads إطلاقاً في حالة open فيفلت من حارس الـ UPDATE) برسالة
--      بنفس بادئة LEAD_WITHDRAW_CLOSED التي تترجمها الواجهة أصلاً.
-- ملاحظة: `claim_lead` يفحص `hidden` منذ v4 (0011) — بلا تغيير هنا.
-- =============================================================================

BEGIN;

-- 1) سياسة التحديث المباشر: مفتوح + غير مخفي ------------------------------------
DROP POLICY IF EXISTS "customers_update_own_open_lead" ON public.leads;
CREATE POLICY "customers_update_own_open_lead" ON public.leads
  FOR UPDATE TO authenticated
  USING (customer_id = (SELECT auth.uid()) AND status = 'open' AND hidden = false)
  WITH CHECK (customer_id = (SELECT auth.uid()) AND status = 'open' AND hidden = false);

-- 2) حارس التجميد ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_lead_hidden_freeze()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.hidden
    AND auth.uid() IS NOT NULL
    AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'lead_hidden_frozen: this lead is hidden by administration'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_lead_hidden_freeze() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_lead_hidden_freeze ON public.leads;
CREATE TRIGGER trg_lead_hidden_freeze
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_lead_hidden_freeze();

-- 3) فحص صريح في سحب الاستلام ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.withdraw_lead_response(p_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead_status TEXT;
  v_customer    UUID;
  v_hidden      BOOLEAN;
  v_removed     BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT status, customer_id, hidden INTO v_lead_status, v_customer, v_hidden
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found.';
  END IF;

  IF v_hidden THEN
    RAISE EXCEPTION 'LEAD_WITHDRAW_CLOSED: هذا الطلب مخفي إدارياً ولا يمكن سحب الاستلام.';
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

COMMIT;
