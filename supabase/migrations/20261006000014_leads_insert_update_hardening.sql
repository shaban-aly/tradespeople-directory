-- =============================================================================
-- 20261006000014_leads_insert_update_hardening (P0)
-- تقوية مساري الإدراج والتحديث المباشرين لجدول الطلبات:
--   1) إخراج `leads` من منشور supabase_realtime — الـ payload الكامل كان يحمل
--      `customer_phone` لأي صنايعي مخوّل بقراءة الصف، متجاوزاً منح الأعمدة
--      (0002/0011). التحديث اللحظي يبقى عبر `lead_responses` (بلا PII) +
--      جدول `notifications` (صفوف المالك فقط) — انظر useLeadsRealtime.
--   2) حذف سياستي 0006 الفضفاضتين (`leads public insert` بلا قيد status،
--      و`leads owner update` بلا قيد status) — كانتا OR مع سياستي 0003
--      المقيّدتين فأبطلتا مفعولهما: إدراج مباشر بأي status، وتحديث مباشر
--      `open ⇒ cancelled` دون إشعار الردّاء الذي يرسله cancel_lead.
--   3) إعادة كتابة سياستي 0003 المتبقيتين بتغليف `(SELECT auth.uid())`
--      (initPlan — قاعدة 3.2) مع الإبقاء على قيد `status='open'`.
--   4) حارس إدراج `guard_lead_insert` (BEFORE INSERT): قيم الخادم تُفرض
--      (`status='open'`, `hidden=false`, `expires_at=now()+24h`,
--      `claimed_at=NULL`) فأي قيمة مرسلة من العميل تُتجاهل — ورفض الإدراج
--      لغير دور `client` (الاستثناء: المشرف عبر is_admin() لأدوات إدارية
--      مستقبلية؛ لا مسار إدراج إداري حالي). الملكية (`customer_id`) يفرضها
--      RLS WITH CHECK كما هي.
-- ملاحظة: دوال الـ RPCs (cancel/complete/renew/withdraw/admin_*) تعمل
-- بـ SECURITY DEFINER فتتجاوز RLS — التقييد هنا يطال المسار المباشر فقط.
-- =============================================================================

BEGIN;

-- 1) إخراج leads من الـ realtime ------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'leads'
    ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.leads;
  END IF;
END $$;

-- 2) حذف السياستين الفضفاضتين ---------------------------------------------------
DROP POLICY IF EXISTS "leads public insert" ON public.leads;
DROP POLICY IF EXISTS "leads owner update" ON public.leads;

-- 3) إعادة كتابة سياستي المالك بتغليف initPlan ----------------------------------
DROP POLICY IF EXISTS "customers_insert_lead" ON public.leads;
CREATE POLICY "customers_insert_lead" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = (SELECT auth.uid())
    AND status = 'open'
  );

DROP POLICY IF EXISTS "customers_update_own_open_lead" ON public.leads;
CREATE POLICY "customers_update_own_open_lead" ON public.leads
  FOR UPDATE TO authenticated
  USING (customer_id = (SELECT auth.uid()) AND status = 'open')
  WITH CHECK (customer_id = (SELECT auth.uid()) AND status = 'open');

-- 4) سياسة المشرف بتغليف initPlan (قاعدة 3.2 — بلا تغيير سلوك) -------------------
DROP POLICY IF EXISTS "leads admin all" ON public.leads;
CREATE POLICY "leads admin all" ON public.leads
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 5) حارس الإدراج: قيم الخادم + دور العميل ---------------------------------------
CREATE OR REPLACE FUNCTION public.guard_lead_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- قيم يحددها الخادم حصراً
  NEW.status := 'open';
  NEW.hidden := false;
  NEW.expires_at := now() + interval '24 hours';
  NEW.claimed_at := NULL;
  NEW.updated_at := now();

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'client' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'lead_client_only: service requests are limited to client accounts'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_lead_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_lead_insert_guard ON public.leads;
CREATE TRIGGER trg_lead_insert_guard
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_lead_insert();

COMMIT;
