-- =============================================================================
-- 20261006000003_lead_owner_actions
-- تمكين مالك الطلب من تعديل (الوصف/الهاتف) أو إلغاء طلبه المفتوح.
-- الحماية:
--   - UPDATE مسموح فقط للمالك وعلى طلب status='open' (سياسة RLS).
--   - category_id/area_id محصوران بقيمهما القديمة عبر trigger حارس
--     (متغيرات OLD غير متاحة داخل WITH CHECK لذا يُفرض الحصر في الـ trigger).
--   - منع التعديل/الإلغاء بعد أول رد فني يُفرض في Server Actions (فحص lead_responses).
-- =============================================================================

BEGIN;

-- 1) سياسة التحديث: المالك فقط وعلى الطلب المفتوح
CREATE POLICY "customers_update_own_open_lead" ON public.leads
    FOR UPDATE TO authenticated
    USING (customer_id = auth.uid() AND status = 'open')
    WITH CHECK (customer_id = auth.uid() AND status = 'open');

-- 2) حارس: لا تغيير للمالك/التخصص/المنطقة من أي مسار (سيرفر أو عميل)
CREATE OR REPLACE FUNCTION public.guard_lead_owner_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.customer_id IS DISTINCT FROM OLD.customer_id
       OR NEW.category_id IS DISTINCT FROM OLD.category_id
       OR NEW.area_id IS DISTINCT FROM OLD.area_id THEN
        RAISE EXCEPTION 'lead_immutable_fields'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_lead_owner_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_lead_owner_update_guard ON public.leads;
CREATE TRIGGER trg_lead_owner_update_guard
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_lead_owner_update();

COMMIT;
