-- ============================================================================
-- 0006_profiles_update_policy.sql — مراجعة جدول profiles
-- ----------------------------------------------------------------------------
-- يغلق فجوات مراجعة profiles (بلا مساس بالبيانات القائمة):
--   1) updated_at على profiles + تريّج تلقائي (اتساق مع craftsmen في 0005).
--   2) سياسة UPDATE للمستخدم على صفّه فقط (display_name/avatar_url) — لم تكن
--      موجودة، فكان تعديل البروفايل الشخصي محظوراً وظيفياً رغم منح UPDATE.
--   3) حارس `trg_profiles_update_guard` يمنع تغيير id/role/craftsman_id/created_at
--      لغير المشرف (المشرف عبر is_admin() يدير الكل) — السياسة + الحارس في نفس
--      الـ migration حتى لا تُفتح نافذة تصعيد لحظة تطبيق السياسة.
-- idempotent ويطابق الـ live.
-- ============================================================================

BEGIN;

-- 1) عمود updated_at + قيم مسبقة + NOT NULL
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2) تريّج طابع updated_at — دالة بسيطة بلا SECURITY DEFINER ولا EXECUTE عام
CREATE OR REPLACE FUNCTION public.touch_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_profiles_updated_at();

REVOKE EXECUTE ON FUNCTION public.touch_profiles_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_profiles_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.touch_profiles_updated_at() FROM authenticated;

-- 3) سياسة UPDATE للمستخدم على صفّه فقط — تُعالج في نفس اللحظة مع الحارس أدناه
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
CREATE POLICY "profiles update own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4) حارس يمنع تصعيد الصلاحيات — لا تغيير لـ id/role/craftsman_id/created_at
--    إلا للمشرف. في غير admin يسمح فقط بالحقول الشخصية الآمنة.
CREATE OR REPLACE FUNCTION public.guard_profiles_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF OLD.id IS DISTINCT FROM NEW.id
     OR OLD.role IS DISTINCT FROM NEW.role
     OR OLD.craftsman_id IS DISTINCT FROM NEW.craftsman_id
     OR OLD.created_at IS DISTINCT FROM NEW.created_at
  THEN
    RAISE EXCEPTION 'غير مصرح — لا يمكن تغيير role أو craftsman_id أو id';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_profiles_update_guard ON public.profiles;
CREATE TRIGGER trg_profiles_update_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_update();

REVOKE EXECUTE ON FUNCTION public.guard_profiles_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_profiles_update() FROM anon;
REVOKE EXECUTE ON FUNCTION public.guard_profiles_update() FROM authenticated;

COMMIT;