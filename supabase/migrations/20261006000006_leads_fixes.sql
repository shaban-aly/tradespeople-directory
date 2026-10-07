-- Migration 20261006000005_leads_fixes.sql

-- 1. إعادة تعريف قيد notifications_type_check الشامل
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
        'lead_removed'
    )
);

-- 2. تحديث دالة العدادات للإدارة
DROP FUNCTION IF EXISTS public.get_admin_nav_counts();
CREATE OR REPLACE FUNCTION public.get_admin_nav_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending_craftsmen INT;
  v_pending_reports INT;
  v_unread_messages INT;
  v_open_leads INT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT count(*)::INT INTO v_pending_craftsmen FROM craftsmen WHERE status = 'pending';
  SELECT count(*)::INT INTO v_pending_reports FROM reports WHERE status = 'pending';
  SELECT count(*)::INT INTO v_unread_messages FROM contact_messages WHERE is_read = false;
  SELECT count(*)::INT INTO v_open_leads FROM leads WHERE status = 'open' AND hidden = false;

  RETURN json_build_object(
    'pendingCraftsmen', v_pending_craftsmen,
    'pendingReports', v_pending_reports,
    'unreadMessages', v_unread_messages,
    'openLeads', v_open_leads
  );
END;
$$;

-- 3. تعديل admin_hide_lead ليكون toggle كامل
CREATE OR REPLACE FUNCTION public.admin_hide_lead(p_lead_id UUID, p_hidden BOOLEAN DEFAULT true)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.leads 
  SET hidden = p_hidden 
  WHERE id = p_lead_id;

  RETURN TRUE;
END;
$$;

-- 4. إعادة إنشاء سياسات leads و lead_responses لتشمل (SELECT auth.uid()) بدلاً من auth.uid() المباشرة

-- Leads
DROP POLICY IF EXISTS "leads public insert" ON public.leads;
DROP POLICY IF EXISTS "leads owner read" ON public.leads;
DROP POLICY IF EXISTS "leads owner update" ON public.leads;
DROP POLICY IF EXISTS "leads admin all" ON public.leads;

CREATE POLICY "leads public insert" ON public.leads
    FOR INSERT TO authenticated
    WITH CHECK (customer_id = (SELECT auth.uid()));

CREATE POLICY "leads owner read" ON public.leads
    FOR SELECT TO authenticated
    USING (customer_id = (SELECT auth.uid()));

CREATE POLICY "leads owner update" ON public.leads
    FOR UPDATE TO authenticated
    USING (customer_id = (SELECT auth.uid()))
    WITH CHECK (customer_id = (SELECT auth.uid()));

CREATE POLICY "leads admin all" ON public.leads
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Lead Responses
DROP POLICY IF EXISTS "lead_responses public read" ON public.lead_responses;
DROP POLICY IF EXISTS "lead_responses craftsman insert" ON public.lead_responses;
DROP POLICY IF EXISTS "lead_responses craftsman read" ON public.lead_responses;
DROP POLICY IF EXISTS "lead_responses admin all" ON public.lead_responses;

CREATE POLICY "lead_responses public read" ON public.lead_responses
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.customer_id = (SELECT auth.uid())
    ));

CREATE POLICY "lead_responses craftsman insert" ON public.lead_responses
    FOR INSERT TO authenticated
    WITH CHECK (
        craftsman_id IN (
            SELECT c.id FROM public.craftsmen c WHERE c.owner_user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "lead_responses craftsman read" ON public.lead_responses
    FOR SELECT TO authenticated
    USING (
        craftsman_id IN (
            SELECT c.id FROM public.craftsmen c WHERE c.owner_user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "lead_responses admin all" ON public.lead_responses
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
