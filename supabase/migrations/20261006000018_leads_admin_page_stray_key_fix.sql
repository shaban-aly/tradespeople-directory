-- =============================================================================
-- 20261006000018_leads_admin_page_stray_key_fix
-- تصحيح خطأ تطبيق 0017: نسخة الدالة المطبقة حياً حملت مفتاحاً زائداً على
-- المستوى الأعلى (`'visibilityAll', 0` خارج `facets`) بسبب لصق استعلام
-- مختلف عن الملف. هذه النسخة — المطابقة لملف 0017 — هي المرجع الصحيح.
-- بلا أي تغيير دلالي آخر.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_admin_leads_page(
  p_search text DEFAULT NULL,
  p_category_slug text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_hidden boolean DEFAULT NULL,
  p_sort text DEFAULT 'newest',
  p_limit integer DEFAULT 12,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limit  int := LEAST(GREATEST(COALESCE(p_limit, 12), 1), 50);
  v_offset int := GREATEST(COALESCE(p_offset, 0), 0);
  v_search text := NULLIF(btrim(COALESCE(p_search, '')), '');
  v_esc    text := replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_');
  v_sort   text := CASE WHEN COALESCE(p_sort, 'newest') IN ('newest', 'oldest', 'expiring')
                        THEN p_sort ELSE 'newest' END;
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  WITH base AS (
    SELECT l.id, l.description, l.customer_phone, l.status, l.created_at,
           l.updated_at, l.expires_at, l.hidden, l.claimed_at, l.customer_id,
           c.name AS category_name, c.slug AS category_slug, a.name AS area_name
    FROM public.leads l
    LEFT JOIN public.categories c ON c.id = l.category_id
    LEFT JOIN public.areas a ON a.id = l.area_id
    WHERE (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (
        v_search IS NULL
        OR l.description ILIKE '%' || v_esc || '%' ESCAPE '\'
        OR l.customer_phone ILIKE '%' || v_esc || '%' ESCAPE '\'
        OR c.name ILIKE '%' || v_esc || '%' ESCAPE '\'
      )
  ),
  status_base AS (
    SELECT * FROM base WHERE (p_hidden IS NULL OR hidden = p_hidden)
  ),
  visibility_base AS (
    SELECT * FROM base WHERE (p_status IS NULL OR status = p_status)
  ),
  filtered AS (
    SELECT * FROM base
    WHERE (p_status IS NULL OR status = p_status)
      AND (p_hidden IS NULL OR hidden = p_hidden)
  ),
  page AS (
    SELECT * FROM filtered
    ORDER BY
      CASE WHEN v_sort = 'oldest' THEN created_at END ASC NULLS LAST,
      CASE WHEN v_sort = 'expiring' THEN expires_at END ASC NULLS LAST,
      CASE WHEN v_sort = 'newest' THEN created_at END DESC NULLS LAST
    LIMIT v_limit OFFSET v_offset
  )
  SELECT jsonb_build_object(
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(page.*)) FROM page), '[]'::jsonb),
    'total', (SELECT count(*) FROM filtered),
    'facets', jsonb_build_object(
      'statusAll', (SELECT count(*) FROM status_base),
      'status', COALESCE(
        (SELECT jsonb_object_agg(s.status, s.cnt)
         FROM (SELECT status, count(*) AS cnt FROM status_base GROUP BY status) s),
        '{}'::jsonb),
      'visibilityAll', (SELECT count(*) FROM visibility_base),
      'visible', (SELECT count(*) FROM visibility_base WHERE NOT hidden),
      'hidden', (SELECT count(*) FROM visibility_base WHERE hidden)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_leads_page(text, text, text, boolean, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_leads_page(text, text, text, boolean, text, integer, integer) TO authenticated;

COMMIT;
