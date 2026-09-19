-- ============================================================================
-- 0024_craftsman_owner_name_update.sql — السماح للفني بتعديل اسمه في البروفايل
-- ----------------------------------------------------------------------------
-- يحدّث دالة الحارس `guard_craftsman_owner_update` على جدول craftsmen:
--   1) السماح للفني صاحب الحساب بتعديل اسمه (name).
--   2) التحقق الصارم من طول وجودة الاسم (بين 2 و 60 حرفاً بعد التنظيف).
--   3) المزامنة التلقائية لاسم العرض display_name في جدول profiles ليبقى متطابقاً.
--   4) الإبقاء على حماية بقية الحقول الإدارية (التوثيق، النشر، الرابط، التخصص، الحالة).
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.guard_craftsman_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_admin() THEN
    -- إذا غيّر المشرف الاسم، نحدث اسم العرض في profiles أيضاً
    IF NEW.name IS DISTINCT FROM OLD.name AND NEW.name IS NOT NULL THEN
      UPDATE public.profiles
      SET display_name = trim(NEW.name)
      WHERE craftsman_id = NEW.id;
    END IF;
    RETURN NEW;
  END IF;

  -- فحص مسار الصورة الشخصية
  IF NEW.image_url IS NOT NULL
     AND NEW.image_url IS DISTINCT FROM OLD.image_url
     AND NEW.image_url NOT LIKE '%/object/public/craftsman-images/craftsmen/'
                          || NEW.id::text || '/%' THEN
    RAISE EXCEPTION 'رابط الصورة غير صالح: يلزم صورة مرفوعة ضمن مجلد الصنايعي الخاص بك'
      USING ERRCODE = '23514';
  END IF;

  -- التحقق من صحة الاسم عند تعديله من الفني
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 OR length(NEW.name) > 60 THEN
      RAISE EXCEPTION 'الاسم غير صالح: يجب أن يكون بين حرفين و 60 حرفاً'
        USING ERRCODE = '23514';
    END IF;

    -- مزامنة اسم العرض في البروفايل تلقائياً عند تغيير اسم الصنايعي
    UPDATE public.profiles
    SET display_name = trim(NEW.name)
    WHERE craftsman_id = NEW.id;
  END IF;

  -- الحقول المحظورة على غير المشرف (التوثيق، النشر، الرابط/الـ slug، التخصص، الحالة، مقدم الطلب)
  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.is_published IS DISTINCT FROM OLD.is_published
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.category_id IS DISTINCT FROM OLD.category_id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by THEN
    RAISE EXCEPTION 'الحقول الإدارية (التوثيق، النشر، الرابط، التخصص، الحالة) لا تُعدَّل إلا من المشرف';
  END IF;

  RETURN NEW;
END;
$function$;

COMMIT;
