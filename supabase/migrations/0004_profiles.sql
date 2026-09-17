-- ============================================================================
-- 0004_profiles.sql — مرحلة 3: profiles (ربط الموافقة + عرض)
-- ----------------------------------------------------------------------------
-- جدول `profiles` كان مفقوداً من السلسلة النقية رغم استدعائه في 0001 (سياسات
-- 0001/0003 وapprove/guard). هذا الـ migration يضيفه تعريفياً:
--   الجدول + RLS (المصفوفة §2: anon=لا شيء، صاحبه يقرأه، admin=الكل) +
--   دوال الهوية (is_admin/get_my_role/get_my_craftsman_id) + دالة إنشاء
--   البروفايل (handle_new_user + trigger على auth.users) + دالة ربط الفني
--   (link_craftsman_user) + المنائح الدقيقة (بلا EXECUTE عام).
-- أسلوب idempotent يطابق الـ live الحالي تماماً.
-- ============================================================================

BEGIN;

-- 1) جدول profiles — تعريف مطابق للـ live: بلا افتراضات خارجية
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  role         text NOT NULL DEFAULT 'client'
               CHECK (role IN ('client', 'craftsman', 'admin')),
  craftsman_id uuid REFERENCES public.craftsmen(id) ON DELETE SET NULL,
  display_name text,
  avatar_url   text
);

-- فهرس فريد جزئي واحد-لواحد (لا يسمح بصفين بنفس الفني)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_craftsman_id_key
  ON public.profiles (craftsman_id)
  WHERE craftsman_id IS NOT NULL;

-- 2) RLS — المصفوفة §2: anon=لا شيء، صاحبه يقرأ، admin الكل
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
CREATE POLICY "profiles read own"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles admin read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin update" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin all" ON public.profiles;
CREATE POLICY "profiles admin all"
  ON public.profiles FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 3) منح الجدول — لا anon، والمسجَّل يقرأ/يحدّث (علامة القراءة بـ RLS)
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- 4) دوال الهوية — SECURITY DEFINER بلا EXECUTE عام (طبقة حماية مع is_admin داخل الجسم)

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = auth.uid()
      AND profile.role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_my_craftsman_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT craftsman_id FROM public.profiles WHERE id = auth.uid();
$function$;

-- 5) دالة إنشاء البروفايل عند التسجيل + trigger على auth.users
--    (role='client' دائماً — لا مصدر آخر للصلاحية)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_display_name text;
BEGIN
  v_display_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, role, display_name, avatar_url)
  VALUES (
    NEW.id,
    'client',
    v_display_name,
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6) ربط حساب الفني — للمشرف فقط (sec definer + is_admin في الجسم)
CREATE OR REPLACE FUNCTION public.link_craftsman_user(
  craftsman_id_input uuid,
  user_email_input text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح — تحتاج صلاحيات مشرف';
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(user_email_input);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'المستخدم غير موجود — تأكد من أنه سجّل دخوله بالموقع أولاً';
  END IF;

  UPDATE public.profiles
  SET role = 'craftsman',
      craftsman_id = craftsman_id_input
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'المستخدم غير موجود — تأكد من أنه سجّل دخوله بالموقع أولاً';
  END IF;

  RETURN true;
END;
$function$;

-- 7) المنائح — لا EXECUTE عام لأي دالة SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_craftsman_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_craftsman_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_craftsman_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.link_craftsman_user(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_craftsman_user(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.link_craftsman_user(uuid, text) TO authenticated;

COMMIT;