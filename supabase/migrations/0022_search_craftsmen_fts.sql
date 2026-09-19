-- ==============================================================================
-- 0022_search_craftsmen_fts.sql
-- تحويل محرك البحث searchCraftsmen إلى قاعدة البيانات عبر pg_trgm و RPC مباشر
-- ==============================================================================

-- 1. تفعيل إضافة الثلاثيات النصية pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. دالة تطبيع الحروف العربية (مطابقة تماماً لـ normalizeArabic في الكود)
-- IMMUTABLE + PARALLEL SAFE لاستخدامها في فهارس التعبيرات والاستعلامات المتوازية
CREATE OR REPLACE FUNCTION public.normalize_arabic(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT lower(
    regexp_replace(
      translate(
        regexp_replace(coalesce(p_text, ''), '[\u064B-\u0652\u0670\u0640\uFEFF]', '', 'g'),
        'أإآءةى',
        'ااااهي'
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

-- 3. فهارس GIN ثلاثية الأبعاد (Trigram) على النصوص المنشورة
CREATE INDEX IF NOT EXISTS idx_craftsmen_name_trgm
  ON public.craftsmen
  USING gin (public.normalize_arabic(name) gin_trgm_ops)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_craftsmen_description_trgm
  ON public.craftsmen
  USING gin (public.normalize_arabic(description) gin_trgm_ops)
  WHERE is_published = true;

-- 4. دالة البحث المركزية فائقة الأداء
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

-- 5. ضبط الصلاحيات (مسموح للزوار والمسجلين لأنها تقرأ الفنيين المنشورين فقط)
REVOKE ALL ON FUNCTION public.search_craftsmen(text, text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_craftsmen(text, text, text, text, integer) TO anon, authenticated;
