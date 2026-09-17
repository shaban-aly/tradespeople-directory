-- ============================================================================
-- 0010_craftsmen_image_lifecycle.sql — دورة حياة الصورة: bucket واحد بلا نسخ
-- ----------------------------------------------------------------------------
-- قرار التصميم (المرحلة 7):
--   • bucket واحد فقط: `craftsman-images` — الرفع المباشر إليه تحت `requests/`
--   • الموافقة: الصورة تَفْضل بمكانها (مجلد requests/) وتصير صورة المنشور — لا نسخ
--   • الرفض: الطلب وصورته يَفْضلوا كما هم — لا حذف (السجلات للأبد، الإزالة يدوية)
--   • تعديل الحارس: يسمح للإبقاء على نفس image_url (حتى لو كان في `requests/`)
--     ويبقى يمنع تغييره لمسار غريب من غير المشرف.
--   • إعلان trigger الحارس رسمياً في السلسلة (كان موجوداً حياً دون ملف مرجع).
-- ============================================================================

BEGIN;

-- 1) إعلان trigger الحارس في السلسلة (idempotent — موجود فعلاً في الـ live)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_craftsman_owner_update_guard'
      AND tgrelid = 'public.craftsmen'::regclass
  ) THEN
    CREATE TRIGGER trg_craftsman_owner_update_guard
      BEFORE UPDATE ON public.craftsmen
      FOR EACH ROW EXECUTE FUNCTION guard_craftsman_owner_update();
  END IF;
END $$;

-- 2) تحديث الحارس: الإبقاء على نفس الصورة مسموح (حتى `requests/` — المنشور بلا نسخ)
--    وتغييرها لمسار آخر مسموح فقط ضمن مجلد الصنايعي نفسه `craftsmen/<id>/`.
CREATE OR REPLACE FUNCTION public.guard_craftsman_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.image_url IS NOT NULL
     AND NEW.image_url IS DISTINCT FROM OLD.image_url
     AND NEW.image_url NOT LIKE '%/object/public/craftsman-images/craftsmen/'
                          || NEW.id::text || '/%' THEN
    RAISE EXCEPTION 'رابط الصورة غير صالح: يلزم صورة مرفوعة ضمن مجلد الصنايعي الخاص بك'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.is_published IS DISTINCT FROM OLD.is_published
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.name IS DISTINCT FROM OLD.name
     OR NEW.category_id IS DISTINCT FROM OLD.category_id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by THEN
    RAISE EXCEPTION 'الحقول الإدارية (التوثيق، النشر، الرابط، الاسم، التخصص، الحالة) لا تُعدَّل إلا من المشرف';
  END IF;

  RETURN NEW;
END;
$function$;

COMMIT;