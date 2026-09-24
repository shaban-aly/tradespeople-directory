-- ============================================================================
-- 0027_craftsman_avatar_position.sql — إضافة موضع وبؤرة الصورة الشخصية للصانع
-- ----------------------------------------------------------------------------
-- يضيف عمود avatar_position من نوع JSONB في جدول craftsmen:
-- يحفظ الإحداثيات بالنسبة المئوية (Focal Point) ومعامل التكبير:
-- مثال: {"x": 50, "y": 50, "zoom": 1}
-- يحدّث دالة search_craftsmen لإرجاع avatar_position ضمن حقول البحث
-- ============================================================================

BEGIN;

-- 1) إضافة العمود مع قيمة افتراضية في المنتصف
ALTER TABLE public.craftsmen
  ADD COLUMN IF NOT EXISTS avatar_position jsonb NOT NULL 
  DEFAULT '{"x": 50, "y": 50, "zoom": 1}'::jsonb;

-- 2) قيد للتحقق من صحة البيانات
ALTER TABLE public.craftsmen
  DROP CONSTRAINT IF EXISTS craftsmen_avatar_position_check;

ALTER TABLE public.craftsmen
  ADD CONSTRAINT craftsmen_avatar_position_check
  CHECK (
    avatar_position ? 'x' AND
    avatar_position ? 'y' AND
    (avatar_position->>'x')::numeric BETWEEN 0 AND 100 AND
    (avatar_position->>'y')::numeric BETWEEN 0 AND 100 AND
    (
      NOT (avatar_position ? 'zoom') OR
      (avatar_position->>'zoom')::numeric >= 1
    )
  );

COMMENT ON COLUMN public.craftsmen.avatar_position IS 
  'إحداثيات بؤرة الصورة (Focal Point) ونسبة التكبير لاستخدامها في CSS object-position';

-- 3) تحديث دالة البحث search_craftsmen لإرجاع avatar_position
DROP FUNCTION IF EXISTS public.search_craftsmen(text, text, text, text, integer);

CREATE OR REPLACE FUNCTION public.search_craftsmen(
  p_query text DEFAULT '',
  p_category text DEFAULT '',
  p_area text DEFAULT '',
  p_sort text DEFAULT 'verified',
  p_limit integer DEFAULT 60
)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  image_url text,
  avatar_position jsonb,
  phone text,
  whatsapp text,
  description text,
  verified boolean,
  added_at date,
  updated_at timestamptz,
  social_links jsonb,
  category jsonb,
  area jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_q text;
  v_limit integer;
BEGIN
  v_q := trim(public.normalize_arabic(p_query));
  v_limit := least(greatest(coalesce(p_limit, 60), 1), 200);

  RETURN QUERY
  SELECT
    c.id,
    c.slug,
    c.name,
    c.image_url,
    c.avatar_position,
    c.phone,
    c.whatsapp,
    c.description,
    c.verified,
    c.added_at,
    c.updated_at,
    c.social_links,
    jsonb_build_object('slug', cat.slug, 'name', cat.name, 'icon', cat.icon) AS category,
    jsonb_build_object('name', a.name) AS area
  FROM public.craftsmen c
  JOIN public.categories cat ON cat.id = c.category_id
  JOIN public.areas a ON a.id = c.area_id
  WHERE c.is_published = true
    AND c.status = 'approved'
    AND (
      p_category IS NULL
      OR p_category = ''
      OR cat.slug = p_category
    )
    AND (
      p_area IS NULL
      OR p_area = ''
      OR a.name = p_area
    )
    AND (
      v_q = ''
      OR public.normalize_arabic(c.name) LIKE ('%' || v_q || '%')
      OR public.normalize_arabic(coalesce(c.description, '')) LIKE ('%' || v_q || '%')
      OR public.normalize_arabic(cat.name) LIKE ('%' || v_q || '%')
      OR cat.slug LIKE ('%' || v_q || '%')
      OR public.normalize_arabic(a.name) LIKE ('%' || v_q || '%')
    )
  ORDER BY
    CASE WHEN p_sort = 'verified' THEN (CASE WHEN c.verified THEN 0 ELSE 1 END) ELSE 0 END ASC,
    CASE
      WHEN v_q <> '' AND public.normalize_arabic(c.name) = v_q THEN 0
      WHEN v_q <> '' AND public.normalize_arabic(c.name) LIKE (v_q || '%') THEN 1
      WHEN v_q <> '' AND public.normalize_arabic(c.name) LIKE ('%' || v_q || '%') THEN 2
      ELSE 3
    END ASC,
    c.added_at DESC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.search_craftsmen(text, text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_craftsmen(text, text, text, text, integer) TO anon, authenticated;

COMMIT;
