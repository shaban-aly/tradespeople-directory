-- =============================================================================
-- 20261006000020_lead_hide_audit (P2-admin-UX / C3)
-- تدقيق الإخفاء الإداري: متى ولماذا أُخفي الطلب.
--   1) عمودا `leads.hidden_at` (timestamptz) و`leads.hidden_reason` (text ≤500)
--      — داخليان للمشرفين فقط (لا يُكشفان للعميل؛ إشعاره عام، ولا منح أعمدة
--      جديدة لـ authenticated — القراءة الإدارية عبر Service Role).
--   2) `admin_hide_lead` بتوقيع موسّع (UUID, BOOLEAN, TEXT DEFAULT NULL):
--      إسقاط التوقيعين القديمين `(UUID)` و`(UUID, BOOLEAN)` أولاً (CREATE OR
--      REPLACE بتوقيع مختلف ينشئ overload ولا يستبدل) ثم إعادة الإنشاء مع
--      ضبط/تصفير الحقلين + إشعار `admin_alert` للعميل عند visible→hidden.
-- عمداً: لا يمس أي دالة قراءة قائمة (get_admin_leads_page/get_my_claimed_leads)
-- — الحقول تُرفق باستعلامات ثانوية من طبقة الـ actions.
-- =============================================================================

BEGIN;

-- 1) الأعمدة ------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_hidden_reason_length'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_hidden_reason_length
      CHECK (hidden_reason IS NULL OR char_length(hidden_reason) <= 500);
  END IF;
END
$$;

-- 2) توسيع admin_hide_lead ------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_hide_lead(UUID);
DROP FUNCTION IF EXISTS public.admin_hide_lead(UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.admin_hide_lead(
  p_lead_id UUID,
  p_hidden BOOLEAN DEFAULT true,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_id UUID;
  v_was_hidden BOOLEAN;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT customer_id, hidden INTO v_customer_id, v_was_hidden
  FROM public.leads WHERE id = p_lead_id;

  UPDATE public.leads
  SET hidden = p_hidden,
      hidden_at = CASE WHEN p_hidden THEN now() ELSE NULL END,
      hidden_reason = CASE WHEN p_hidden THEN left(NULLIF(btrim(p_reason), ''), 500) ELSE NULL END
  WHERE id = p_lead_id;

  IF FOUND AND p_hidden AND NOT COALESCE(v_was_hidden, false)
    AND v_customer_id IS NOT NULL THEN
    PERFORM public.create_notification(
      v_customer_id,
      'admin_alert',
      'تم إيقاف طلبك مؤقتاً',
      'أوقفت الإدارة عرض طلبك على الصنايعية مؤقتاً. يمكنك إضافة طلب جديد بتفاصيل أوضح.',
      jsonb_build_object('lead_id', p_lead_id, 'link', '/profile/requests')
    );
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_hide_lead(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hide_lead(UUID, BOOLEAN, TEXT) TO authenticated;

COMMIT;
