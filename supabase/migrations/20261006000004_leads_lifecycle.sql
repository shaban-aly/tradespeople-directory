-- =============================================================================
-- 20261006000004_leads_lifecycle
-- إضافة دورة الحياة لصلاحيات الطلبات (المرحلة 2):
-- 1. أعمدة جديدة: updated_at, expires_at, hidden.
-- 2. حالات جديدة: expired, completed.
-- 3. Trigger حارس يمنع التعديل غير المصرح به والانتقالات غير المسموحة.
-- 4. دوال المشرف (admin_delete_lead, admin_hide_lead, complete_lead).
-- 5. مهام مجدولة (pg_cron) لانتهاء الصلاحية والحذف التلقائي.
-- 6. إشعارات المشرفين عند إضافة طلب جديد.
-- =============================================================================

BEGIN;

-- 1. إضافة الأعمدة والقيود ----------------------------------------------------
ALTER TABLE public.leads 
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '24 hours',
  ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT false;

-- تحديث قيد الحالة (status check)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN ('open', 'claimed', 'cancelled', 'expired', 'completed'));

-- 2. حارس الانتقالات والتعديلات ------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_lead_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_responses_count INT;
BEGIN
  -- تحديث وقت التعديل
  NEW.updated_at = now();

  IF TG_OP = 'UPDATE' THEN
    -- إذا تم تعديل الوصف أو الهاتف
    IF NEW.description IS DISTINCT FROM OLD.description OR NEW.customer_phone IS DISTINCT FROM OLD.customer_phone THEN
      IF OLD.status != 'open' THEN
        RAISE EXCEPTION 'Cannot edit lead unless it is open';
      END IF;
      
      SELECT count(*) INTO v_responses_count FROM public.lead_responses WHERE lead_id = NEW.id;
      IF v_responses_count > 0 THEN
        RAISE EXCEPTION 'Cannot edit lead after it has responses';
      END IF;
    END IF;

    -- التحقق من انتقال الحالة
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF OLD.status IN ('completed', 'cancelled', 'expired') THEN
        RAISE EXCEPTION 'Cannot change status from %', OLD.status;
      END IF;
      IF OLD.status = 'claimed' AND NEW.status NOT IN ('completed') THEN
        RAISE EXCEPTION 'Claimed leads can only be completed';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_guard_trigger ON public.leads;
CREATE TRIGGER leads_guard_trigger
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_lead_status_transition();

-- 3. دوال المشرف (RPCs) --------------------------------------------------------

-- إنهاء الطلب (من قِبل العميل المالك)
CREATE OR REPLACE FUNCTION public.complete_lead(p_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.leads 
  SET status = 'completed' 
  WHERE id = p_lead_id AND customer_id = auth.uid() AND status = 'claimed';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found, not owned by you, or not in claimed state';
  END IF;

  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_lead(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_lead(UUID) TO authenticated;

-- إخفاء الطلب (من قِبل المشرف)
CREATE OR REPLACE FUNCTION public.admin_hide_lead(p_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.leads SET hidden = true WHERE id = p_lead_id;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_hide_lead(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hide_lead(UUID) TO authenticated;

-- حذف الطلب (من قِبل المشرف مع إشعار)
CREATE OR REPLACE FUNCTION public.admin_delete_lead(p_lead_id UUID, p_reason TEXT DEFAULT 'مخالفة الشروط')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_customer_id UUID;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT customer_id INTO v_customer_id FROM public.leads WHERE id = p_lead_id;
  
  DELETE FROM public.leads WHERE id = p_lead_id;
  
  IF FOUND AND v_customer_id IS NOT NULL THEN
    PERFORM public.create_notification(
      v_customer_id,
      'admin_alert',
      'تم حذف طلبك 🗑️',
      'تم حذف طلبك بواسطة الإدارة. السبب: ' || p_reason,
      '{}'::jsonb
    );
  END IF;

  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_lead(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_lead(UUID, TEXT) TO authenticated;

-- 4. إشعارات المشرفين وسياسات العرض --------------------------------------------

-- إضافة إشعار المشرفين عند إضافة طلب جديد
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

    -- إشعار الصنايعية
    FOR v_craftsman IN
        SELECT DISTINCT owner_user_id 
        FROM public.craftsmen 
        WHERE category_id = NEW.category_id 
        AND status = 'approved'
        AND owner_user_id IS NOT NULL
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

-- تعديل سياسة عرض الطلبات المفتوحة لتجاهل الطلبات المخفية
DROP POLICY IF EXISTS "craftsmen_view_open_leads" ON public.leads;
CREATE POLICY "craftsmen_view_open_leads" ON public.leads
    FOR SELECT TO authenticated
    USING (
        status = 'open' AND
        hidden = false AND
        category_id IN (
            SELECT category_id FROM public.craftsmen 
            WHERE owner_user_id = auth.uid() AND status = 'approved'
        )
    );

-- تحديث دالة جلب الطلبات المستلمة لتجاهل الطلبات المخفية
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
    AND l.hidden = false
  ORDER BY l.id, lr.created_at DESC
  LIMIT 200;
$$;
REVOKE ALL ON FUNCTION public.get_my_claimed_leads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_claimed_leads() TO authenticated;

-- 5. المهام المجدولة (pg_cron) -------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.leads 
  SET status = 'expired'
  WHERE status = 'open' AND expires_at < now();
END;
$$;
REVOKE ALL ON FUNCTION public.expire_stale_leads() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.purge_old_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.leads 
  WHERE status IN ('expired', 'cancelled') 
    AND created_at < now() - interval '30 days';
END;
$$;
REVOKE ALL ON FUNCTION public.purge_old_leads() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- إنتهاء صلاحية الطلبات المفتوحة (كل 5 دقائق)
    PERFORM cron.schedule('expire_stale_leads_job', '*/5 * * * *', 'SELECT public.expire_stale_leads()');
    -- تنظيف الطلبات القديمة الميتة (يومياً عند منتصف الليل)
    PERFORM cron.schedule('purge_old_leads_job', '0 0 * * *', 'SELECT public.purge_old_leads()');
  END IF;
END $$;

COMMIT;
