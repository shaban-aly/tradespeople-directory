-- =============================================================================
-- 20261006000019_lead_images_column (P1 — صور المشكلة)
-- عمود صور اختياري على الطلب نفسه (حد 3) — لا جدول جديد:
--   1) `leads.image_urls text[]` افتراضي فارغ + CHECK عدد (≤3).
--   2) حارس `guard_lead_image_urls` (BEFORE INSERT OR UPDATE): كل عنصر يجب
--      أن يكون URL عاماً داخل `craftsman-images/leads/` (منع hotlinking) —
--      CHECK لا يقبل subqueries/unnest فالحارس trigger هو الأداة الصحيحة.
--   3) تحديث منح SELECT العمودية (نمط 0002/0011): إعادة GRANT مع `image_urls`
--      وإلا فشل select العميل بصمت على العمود الجديد.
--   4) `guard_lead_status_transition`: إدراج `image_urls` في شرط الحقول
--      القابلة للتحرير (مفتوح + بلا ردود فقط) — نفس قاعدة الوصف/الهاتف.
--   5) توسيع قراءات الصنايعي/العميل/الأدمن بحقل `image_urls` (إسقاط التوقيع
--      القديم صراحةً عند تغيّر شكل الإرجاع — درس 9-fix-2).
-- =============================================================================

BEGIN;

-- 1) العمود + قيد العدد ------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN image_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.leads
  ADD CONSTRAINT leads_image_urls_count
  CHECK (cardinality(image_urls) <= 3);

-- 2) حارس البادئة والعدد ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_lead_image_urls()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_url TEXT;
BEGIN
  IF cardinality(COALESCE(NEW.image_urls, '{}')) > 3 THEN
    RAISE EXCEPTION 'lead_too_many_images' USING ERRCODE = '23514';
  END IF;
  FOREACH v_url IN ARRAY COALESCE(NEW.image_urls, '{}') LOOP
    IF v_url NOT LIKE '%/craftsman-images/leads/%' THEN
      RAISE EXCEPTION 'lead_foreign_image_url' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_lead_image_urls() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_lead_image_urls_guard ON public.leads;
CREATE TRIGGER trg_lead_image_urls_guard
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_lead_image_urls();

-- 3) منح الأعمدة (إعادة كاملة مع العمود الجديد) --------------------------------------
REVOKE SELECT ON public.leads FROM anon, authenticated;
GRANT SELECT (id, customer_id, category_id, area_id, description, status,
  created_at, claimed_at, updated_at, expires_at, hidden, image_urls)
  ON public.leads TO authenticated;

-- 4) حارس الانتقالات: image_urls حقل تحرير عادي ---------------------------------------
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
    -- إذا تم تعديل الوصف أو الهاتف أو الصور
    IF NEW.description IS DISTINCT FROM OLD.description
       OR NEW.customer_phone IS DISTINCT FROM OLD.customer_phone
       OR NEW.image_urls IS DISTINCT FROM OLD.image_urls THEN
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
      -- إعادة فتح بعد سحب رد (claimed ⇒ open): فقط إذا نزلت الردود تحت 3 فعلياً
      IF OLD.status = 'claimed' AND NEW.status = 'open' THEN
        SELECT count(*) INTO v_responses_count FROM public.lead_responses WHERE lead_id = NEW.id;
        IF v_responses_count >= 3 THEN
          RAISE EXCEPTION 'Claimed leads with full responses cannot reopen';
        END IF;
        RETURN NEW;
      END IF;

      -- تجديد طلب منتهٍ (expired ⇒ open): فقط بـ expires_at أحدث من الحالي
      IF OLD.status = 'expired' AND NEW.status = 'open' THEN
        IF NEW.expires_at IS NOT DISTINCT FROM OLD.expires_at THEN
          RAISE EXCEPTION 'Renewing requires a new expires_at';
        END IF;
        RETURN NEW;
      END IF;

      IF OLD.status IN ('completed', 'cancelled', 'expired') THEN
        RAISE EXCEPTION 'Cannot change status from %', OLD.status;
      END IF;
      IF OLD.status = 'claimed' AND NEW.status NOT IN ('completed', 'cancelled', 'open') THEN
        RAISE EXCEPTION 'Claimed leads can only be completed, cancelled by owner, or reopened after withdrawal';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5) توسيع القراءات -------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_open_leads_for_me(integer, integer);
CREATE OR REPLACE FUNCTION public.get_open_leads_for_me(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE (
  id             uuid,
  description    text,
  created_at     timestamptz,
  expires_at     timestamptz,
  category_id    uuid,
  category_name  text,
  area_name      text,
  response_count int,
  image_urls     text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    l.id,
    l.description,
    l.created_at,
    l.expires_at,
    l.category_id,
    c.name,
    a.name,
    (SELECT count(*)::int FROM public.lead_responses lr WHERE lr.lead_id = l.id),
    l.image_urls
  FROM public.leads l
  LEFT JOIN public.categories c ON c.id = l.category_id
  LEFT JOIN public.areas a      ON a.id = l.area_id
  WHERE l.status = 'open'
    AND l.hidden = false
    AND l.expires_at > now()
    AND l.customer_id IS DISTINCT FROM auth.uid()
    AND l.category_id IN (
      SELECT category_id FROM public.craftsmen
      WHERE owner_user_id = auth.uid()
        AND status = 'approved'
        AND is_published = true
    )
  ORDER BY l.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION public.get_open_leads_for_me(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_open_leads_for_me(integer, integer) TO authenticated;

DROP FUNCTION IF EXISTS public.get_my_claimed_leads(integer, integer);
CREATE OR REPLACE FUNCTION public.get_my_claimed_leads(p_limit integer DEFAULT 200, p_offset integer DEFAULT 0)
RETURNS TABLE (
  lead_id        uuid,
  description    text,
  customer_phone text,
  status         text,
  created_at     timestamptz,
  claimed_at     timestamptz,
  category_name  text,
  area_name      text,
  image_urls     text[]
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
    a.name,
    l.image_urls
  FROM public.lead_responses lr
  JOIN public.craftsmen cr ON cr.id = lr.craftsman_id
  JOIN public.leads l      ON l.id = lr.lead_id
  LEFT JOIN public.categories c ON c.id = l.category_id
  LEFT JOIN public.areas a      ON a.id = l.area_id
  WHERE cr.owner_user_id = auth.uid()
    AND auth.uid() IS NOT NULL
    AND l.hidden = false
  ORDER BY l.id, lr.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 200)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION public.get_my_claimed_leads(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_claimed_leads(integer, integer) TO authenticated;

DROP FUNCTION IF EXISTS public.get_customer_lead_responses();
CREATE OR REPLACE FUNCTION public.get_customer_lead_responses()
RETURNS TABLE (
  lead_id       uuid,
  response_id   uuid,
  responded_at  timestamptz,
  craftsman_id  uuid,
  slug          text,
  name          text,
  phone         text,
  whatsapp      text,
  verified      boolean,
  image_url     text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT lr.lead_id, lr.id, lr.created_at,
         cr.id, cr.slug, cr.name, cr.phone, cr.whatsapp, cr.verified, cr.image_url
  FROM public.lead_responses lr
  JOIN public.leads l      ON l.id = lr.lead_id
  JOIN public.craftsmen cr ON cr.id = lr.craftsman_id
  WHERE l.customer_id = auth.uid()
    AND auth.uid() IS NOT NULL
  ORDER BY lr.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_customer_lead_responses() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_customer_lead_responses() TO authenticated;

-- ترقيم الأدمن: إضافة العمود للـ CTE (شكل الإرجاع jsonb ثابت — بلا إسقاط) --------------
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
           l.image_urls,
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
