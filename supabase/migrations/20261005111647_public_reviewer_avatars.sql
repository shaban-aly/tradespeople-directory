-- 0033_public_reviewer_avatars.sql
-- (مطبَّقة على الـ live بالنسخة `20261005111647_public_reviewer_avatars`)
-- صورة صاحب التقييم في واجهة الدليل (صنايعي + مودال كل التقييمات).
--
-- المشكلة: `profiles.avatar_url` هو المصدر الوحيد لصور المستخدمين، وسياسة
-- `profiles read own` تجعل anon لا يرى إلا صفّه ⇒ لا يمكن لصفحة الصنايعي
-- (تُقرأ بعميل anon) جلب صورة من نشر تقييماً. و`reviews.user_id` FK إلى
-- `auth.users` لا إلى `profiles`، فnested select لا يحلّ العلاقة أصلاً
-- (حتى لو حُلّت، RLS على profiles يمنع الصف)).
--
-- القرار: دالة قراءة عامة واحدة تُعيد (user_id, avatar_url) **لمن نشر تقييماً
-- فقط** — لا تفتح profiles، ولا تكشف أي حقل آخر (لا role ولا display_name
-- ولا بريد ولا أي شيء). الاسم معروض أصلاً عبر reviews.user_name، ورابط الصورة
-- من OAuth عام أصلاً؛ فالنشر فعل مواعٍ به.
--
-- الضوابط (استثناء توثيقي لـEXECUTE عام على SECURITY DEFINER):
--   1) search_path مثبّت + مدخلات محدودة داخلياً (سقف 50 مُعرّفاً لكل نداء).
--   2) لا تُعاد إلا الصفوف التي لها EXISTS في reviews ⇒ لا استطلاع لـprofiles.
--   3) avatar_url الفارغ/الناصح يُعاد NULL (يُعرض الحرف الأول بدل الصورة).
--   4) REVOKE من PUBLIC ثم GRANT صريح لـanon + authenticated (استدعاء anon
--      مطلوب لأن صفحة الصنايعي صفحة عامة).

-- 1) الدالة (idempotent: CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.get_public_reviewer_avatars(p_user_ids uuid[])
RETURNS TABLE (user_id uuid, avatar_url text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  c_max_ids constant integer := 50;
BEGIN
  IF p_user_ids IS NULL OR cardinality(p_user_ids) = 0 THEN
    RETURN;
  END IF;

  IF cardinality(p_user_ids) > c_max_ids THEN
    RAISE EXCEPTION 'get_public_reviewer_avatars: too many ids (max %)', c_max_ids
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT p.id AS user_id, NULLIF(BTRIM(p.avatar_url), '') AS avatar_url
  FROM public.profiles p
  WHERE p.id = ANY (p_user_ids)
    AND EXISTS (
      SELECT 1 FROM public.reviews r WHERE r.user_id = p.id
    );
END;
$fn$;

COMMENT ON FUNCTION public.get_public_reviewer_avatars(uuid[]) IS
  'صور أصحاب التقييمات العامة — تُعيد avatar_url فقط لمن نشر تقييماً (سقف 50 مُعرّفاً لكل نداء)';

-- 2) المنح: لا EXECUTE عام، فقط anon + authenticated (استثناء موثّق أعلاه)
REVOKE ALL ON FUNCTION public.get_public_reviewer_avatars(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_reviewer_avatars(uuid[]) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_reviewer_avatars(uuid[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_reviewer_avatars(uuid[]) TO anon, authenticated;