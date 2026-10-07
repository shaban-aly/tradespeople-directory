-- =============================================================================
-- 20261006000013_leads_realtime_board
-- 1) نشر leads/lead_responses في supabase_realtime — التحديث اللحظي لصفحتي
--    العميل والصنايعي. الاستقبال يخضع لـ RLS (كل مستخدم يستقبل أحداث الصفوف
--    التي يملك صلاحية قراءتها فقط) — idempotent.
-- 2) get_open_leads_for_me: لوحة فرص الصانع عبر RPC واحد يعيد response_count
--    (العدّ غير مشتق عبر embed لأن RLS يحجب ردود الآخرين) + expires_at.
-- =============================================================================

BEGIN;

-- 1) Realtime -------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_responses;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 2) لوحة الفرص -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_open_leads_for_me()
RETURNS TABLE (
  id             uuid,
  description    text,
  created_at     timestamptz,
  expires_at     timestamptz,
  category_id    uuid,
  category_name  text,
  area_name      text,
  response_count int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    l.id,
    l.description,
    l.created_at,
    l.expires_at,
    l.category_id,
    c.name,
    a.name,
    (SELECT count(*)::int FROM public.lead_responses lr WHERE lr.lead_id = l.id)
  FROM public.leads l
  LEFT JOIN public.categories c ON c.id = l.category_id
  LEFT JOIN public.areas a      ON a.id = l.area_id
  WHERE l.status = 'open'
    AND l.hidden = false
    AND l.expires_at > now()
    AND l.customer_id IS DISTINCT FROM auth.uid()
    AND l.category_id IN (
      SELECT category_id FROM public.craftsmen
      WHERE owner_user_id = auth.uid()
        AND status = 'approved'
        AND is_published = true
    )
  ORDER BY l.created_at DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.get_open_leads_for_me() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_open_leads_for_me() TO authenticated;

COMMIT;
