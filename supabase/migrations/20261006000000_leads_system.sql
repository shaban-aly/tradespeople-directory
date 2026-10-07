-- =============================================================================
-- 20261006000000_leads_system
-- نظام الطلبات المفتوحة (Lead Generation) - 3 صنايعية كحد أقصى للطلب
-- =============================================================================

BEGIN;

-- 1. جدول الطلبات
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id),
    area_id UUID NOT NULL REFERENCES public.areas(id),
    description TEXT NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    claimed_at TIMESTAMPTZ
);

-- 2. جدول الردود
CREATE TABLE public.lead_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    craftsman_id UUID NOT NULL REFERENCES public.craftsmen(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(lead_id, craftsman_id)
);

-- 3. تفعيل RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_responses ENABLE ROW LEVEL SECURITY;

-- 4. سياسات جدول الطلبات (leads)
-- العميل يرى طلباته فقط
CREATE POLICY "customers_view_own_leads" ON public.leads
    FOR SELECT TO authenticated
    USING (customer_id = auth.uid());

-- الصنايعي يرى الطلبات المفتوحة في تخصصه
CREATE POLICY "craftsmen_view_open_leads" ON public.leads
    FOR SELECT TO authenticated
    USING (
        status = 'open' AND
        category_id IN (
            SELECT category_id FROM public.craftsmen 
            WHERE owner_user_id = auth.uid() AND status = 'approved'
        )
    );

-- الصنايعي يرى الطلبات التي شارك فيها
CREATE POLICY "craftsmen_view_claimed_leads" ON public.leads
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT lead_id FROM public.lead_responses 
            WHERE craftsman_id IN (
                SELECT id FROM public.craftsmen WHERE owner_user_id = auth.uid()
            )
        )
    );

-- العميل يضيف طلب
CREATE POLICY "customers_insert_lead" ON public.leads
    FOR INSERT TO authenticated
    WITH CHECK (
        customer_id = auth.uid() AND 
        status = 'open'
    );

-- 5. سياسات جدول الردود (lead_responses)
-- العميل يرى الردود على طلباته
CREATE POLICY "customers_view_lead_responses" ON public.lead_responses
    FOR SELECT TO authenticated
    USING (
        lead_id IN (
            SELECT id FROM public.leads WHERE customer_id = auth.uid()
        )
    );

-- الصنايعي يرى الردود الخاصة به
CREATE POLICY "craftsmen_view_own_responses" ON public.lead_responses
    FOR SELECT TO authenticated
    USING (
        craftsman_id IN (
            SELECT id FROM public.craftsmen WHERE owner_user_id = auth.uid()
        )
    );

-- 6. دالة (RPC) لاستلام الطلب (آمنة من التضارب - أقصى حد 3)
CREATE OR REPLACE FUNCTION public.claim_lead(p_lead_id UUID, p_craftsman_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_responses_count INT;
    v_status TEXT;
    v_owner UUID;
    v_customer_id UUID;
BEGIN
    -- التحقق من ملكية الحساب الصنايعي
    SELECT owner_user_id INTO v_owner FROM public.craftsmen WHERE id = p_craftsman_id;
    IF v_owner IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: You do not own this craftsman profile.';
    END IF;

    -- قفل صف الطلب للتأكد من عدم وجود تضارب (Row-level lock)
    SELECT status, customer_id INTO v_status, v_customer_id 
    FROM public.leads 
    WHERE id = p_lead_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found.';
    END IF;

    IF v_status != 'open' THEN
        RETURN FALSE; -- الطلب أُغلق بالفعل
    END IF;

    -- التحقق من العدد
    SELECT count(*) INTO v_responses_count FROM public.lead_responses WHERE lead_id = p_lead_id;
    IF v_responses_count >= 3 THEN
        -- حالة نادرة جداً لو أفلتت، نغلق الطلب هنا كوقاية إضافية
        UPDATE public.leads SET status = 'claimed', claimed_at = now() WHERE id = p_lead_id;
        RETURN FALSE;
    END IF;

    -- تسجيل الرد
    BEGIN
        INSERT INTO public.lead_responses (lead_id, craftsman_id) 
        VALUES (p_lead_id, p_craftsman_id);
    EXCEPTION WHEN unique_violation THEN
        -- الصنايعي رد بالفعل مسبقاً
        RETURN TRUE;
    END;

    -- إذا أصبح العدد 3 بعد الرد، أغلق الطلب
    IF (v_responses_count + 1) >= 3 THEN
        UPDATE public.leads SET status = 'claimed', claimed_at = now() WHERE id = p_lead_id;
    END IF;

    -- إرسال إشعار للعميل أن هناك صنايعي وافق على الطلب
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
REVOKE ALL ON FUNCTION public.claim_lead(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_lead(UUID, UUID) TO authenticated;

-- 7. Trigger: إرسال إشعارات للصنايعية عند إنشاء طلب جديد
CREATE OR REPLACE FUNCTION public.notify_craftsmen_on_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_craftsman RECORD;
    v_category_name TEXT;
    v_area_name TEXT;
BEGIN
    SELECT name INTO v_category_name FROM public.categories WHERE id = NEW.category_id;
    SELECT name INTO v_area_name FROM public.areas WHERE id = NEW.area_id;

    FOR v_craftsman IN
        SELECT DISTINCT owner_user_id 
        FROM public.craftsmen 
        WHERE category_id = NEW.category_id 
        AND status = 'approved'
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
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_lead_inserted
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_craftsmen_on_new_lead();

COMMIT;
