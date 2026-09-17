-- ============================================================================
-- 0003_reviews_favorites.sql — مرحلة 2: reviews + favorites (فترة M2M)
-- ----------------------------------------------------------------------------
-- يبني الجدولين تعريفيّاً في السلسلة الجديدة (الـ live يحملهما مسبقاً من
-- السلسلة القديمة) وأسلوب idempotent: IF NOT EXISTS / DROP + CREATE / OR REPLACE.
-- يكتمل وفق مصفوفة الأدوار (DATABASE-RULES §2):
--   favorites: anon=لا شيء، client/craftsman=ملكيته، admin=الكل
--   reviews  : anon=قراءة، client=إضافة/تعديل/حذف ملكيته، admin=الكل
-- يُضاف ما كان ناقصاً على الـ live: سياسات admin (is_admin) + تنظيف الـ grants
-- الزائدة على view عدّادات التصنيفات (SELECT فقط للقراءة العامة).
-- ============================================================================

BEGIN;

-- 1) جداول المرحلة — تعريف نقي يطابق الـ live، بلا أثر للـ legacy
CREATE TABLE IF NOT EXISTS public.favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  craftsman_id uuid NOT NULL REFERENCES public.craftsmen(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  craftsman_id uuid NOT NULL REFERENCES public.craftsmen(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name   text NOT NULL DEFAULT 'عميل',
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text CHECK (char_length(comment) <= 500),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2) قيود فريدة (فهرس خلفي) + فهارس علائقية — idempotent
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_craftsman_unique
  ON public.favorites (user_id, craftsman_id);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_craftsman_unique
  ON public.reviews (user_id, craftsman_id);

CREATE INDEX IF NOT EXISTS idx_favorites_craftsman_id
  ON public.favorites (craftsman_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id
  ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_craftsman_id
  ON public.reviews (craftsman_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id
  ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at
  ON public.reviews (created_at DESC);

-- 3) RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews  ENABLE ROW LEVEL SECURITY;

-- 4) سياسات favorites — مصفوفة §2 (ملكية + admin)
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "favorites user select own" ON public.favorites;
DROP POLICY IF EXISTS "favorites user insert own" ON public.favorites;
DROP POLICY IF EXISTS "favorites user delete own" ON public.favorites;
DROP POLICY IF EXISTS "favorites admin all" ON public.favorites;

CREATE POLICY "favorites user select own"
  ON public.favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "favorites user insert own"
  ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites user delete own"
  ON public.favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "favorites admin all"
  ON public.favorites FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 5) سياسات reviews — مصفوفة §2 (قراءة عامة + ملكية + admin)
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "reviews public select" ON public.reviews;
DROP POLICY IF EXISTS "reviews user insert own" ON public.reviews;
DROP POLICY IF EXISTS "reviews user update own" ON public.reviews;
DROP POLICY IF EXISTS "reviews user delete own" ON public.reviews;
DROP POLICY IF EXISTS "reviews admin all" ON public.reviews;

CREATE POLICY "reviews public select"
  ON public.reviews FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "reviews user insert own"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews user update own"
  ON public.reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews user delete own"
  ON public.reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "reviews admin all"
  ON public.reviews FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 6) منح الجداول — بلا UPDATE لـ favorites (الجدول إنشاء/حذف فقط)
REVOKE ALL ON public.favorites FROM anon;
REVOKE UPDATE ON public.favorites FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;

REVOKE ALL ON public.reviews FROM anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

-- 7) حرّاس المنطق (SECURITY DEFINER بلا EXECUTE عام)
CREATE OR REPLACE FUNCTION public.guard_favorite_target()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_published_ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.craftsmen
    WHERE id = NEW.craftsman_id
      AND is_published = true
  ) INTO v_published_ok;

  IF NOT v_published_ok THEN
    RAISE EXCEPTION 'لا يمكن حفظ صنايعي غير منشور في المفضلة'
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_review_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_display_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_display_name := (
      SELECT display_name
      FROM public.profiles
      WHERE id = NEW.user_id
    );

    NEW.user_name := COALESCE(v_display_name, 'عميل');
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'لا يمكن تغيير صاحب التقييم بعد الإنشاء';
    END IF;

    IF NEW.craftsman_id IS DISTINCT FROM OLD.craftsman_id THEN
      RAISE EXCEPTION 'لا يمكن نقل التقييم إلى صانع آخر';
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

-- لا منح EXECUTE عام: لا للـ PUBLIC ولا لجرّات الدعوة (طُبّق على الـ live).
REVOKE EXECUTE ON FUNCTION public.guard_favorite_target() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_favorite_target() FROM anon;
REVOKE EXECUTE ON FUNCTION public.guard_favorite_target() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_review_write() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_review_write() FROM anon;
REVOKE EXECUTE ON FUNCTION public.guard_review_write() FROM authenticated;

-- 8) الـ triggers
DROP TRIGGER IF EXISTS trg_favorite_target_guard ON public.favorites;
CREATE TRIGGER trg_favorite_target_guard
  BEFORE INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.guard_favorite_target();

DROP TRIGGER IF EXISTS trg_review_write_guard ON public.reviews;
CREATE TRIGGER trg_review_write_guard
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.guard_review_write();

-- 9) المشاهد التجميعية — security_invoker (RLS للجداول الأساسية)
CREATE OR REPLACE VIEW public.craftsman_rating_summaries
WITH (security_invoker = true) AS
SELECT craftsman_id,
       round(avg(rating), 1)::double precision AS average_rating,
       count(*)::integer                       AS total_reviews
FROM public.reviews
GROUP BY craftsman_id;

CREATE OR REPLACE VIEW public.craftsman_counts_by_category
WITH (security_invoker = true) AS
SELECT c.id AS category_id,
       c.slug,
       count(cr.id) AS craftsman_count
FROM public.categories c
LEFT JOIN public.craftsmen cr
  ON cr.category_id = c.id AND cr.is_published = true
WHERE c.is_active = true
GROUP BY c.id, c.slug;

-- تنظيف grants الزائدة على المشاهد (قراءة عامة فقط)
REVOKE ALL ON public.craftsman_rating_summaries FROM anon;
REVOKE ALL ON public.craftsman_rating_summaries FROM authenticated;
GRANT SELECT ON public.craftsman_rating_summaries TO anon, authenticated;

REVOKE ALL ON public.craftsman_counts_by_category FROM anon;
REVOKE ALL ON public.craftsman_counts_by_category FROM authenticated;
GRANT SELECT ON public.craftsman_counts_by_category TO anon, authenticated;

-- 10) RPCs القراءات العامة — استثناء موثّق (أرقام مجمّعة لا بيانات خاصة)
CREATE OR REPLACE FUNCTION public.get_craftsman_favorites_count(p_craftsman_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*) FROM public.favorites WHERE craftsman_id = p_craftsman_id
$function$;

CREATE OR REPLACE FUNCTION public.get_craftsman_rating_summary(p_craftsman_id uuid)
RETURNS TABLE(average_rating numeric, total_reviews integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT average_rating, total_reviews
  FROM public.craftsman_rating_summaries
  WHERE craftsman_id = p_craftsman_id;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_craftsman_favorites_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_craftsman_favorites_count(uuid) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_craftsman_rating_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_craftsman_rating_summary(uuid) TO anon, authenticated;

COMMIT;