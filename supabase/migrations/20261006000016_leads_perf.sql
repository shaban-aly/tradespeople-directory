-- =============================================================================
-- 20261006000016_leads_perf (P2)
-- أداء مسارات الليدز الساخنة:
--   1) `notify_craftsmen_on_new_lead` بإدراج مجمّع (INSERT..SELECT) بدل حلقة
--      PERFORM لكل صنايعي/مشرف — نفس الدلالات تماماً (المعتمدون المنشورون في
--      التخصص عدا العميل نفسه + كل المشرفين) بمفاتيح حتمية تمنع التكرار حتى
--      عند إعادة التشغيل: `lead_new:<lead>:<owner>` و`admin_alert:lead:<lead>:<admin>`.
--   2) إشعار التجديد في `renew_lead` بنفس الأسلوب (`lead_renewed:<lead>:<owner>`).
--      حلقات الردّاء (cancel/complete/expire/withdraw) محدودة بالردود (≤3)
--      فتُترك كما هي.
--   3) RPC ترقيم لوحة الأدمن `get_admin_leads_page` (فحص is_admin داخلي):
--      فلترة بحث (وصف/هاتف/تخصص — بـ strpos لا ILIKE wildcard لتفادي حقن
--      `%`/`_`) + تخصص + حالة + رؤية + فرز (newest/oldest/expiring) + حدّ
--      1..50، ويعيد jsonb واحداً: items (صفحة) + total (بعد كل الفلاتر) +
--      facets بنفس دلالات countLeadFacets (كل بُعد يُحسب بعد باقي الأبعاد).
--   4) ترقيم `get_open_leads_for_me` و`get_my_claimed_leads` (p_limit/p_offset
--      بحدّ 200) — الافتراضات تحافظ على السلوك الحالي.
-- =============================================================================

BEGIN;

-- 1) إشعار الطلب الجديد — مجمّع --------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_craftsmen_on_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_category_name TEXT;
  v_area_name     TEXT;
BEGIN
  SELECT name INTO v_category_name FROM public.categories WHERE id = NEW.category_id;
  SELECT name INTO v_area_name FROM public.areas WHERE id = NEW.area_id;

  INSERT INTO public.notifications (recipient_id, type, title, body, metadata, key)
  SELECT DISTINCT cr.owner_user_id,
    'lead_new',
    'طلب عمل جديد متاح 🚨',
    'مطلوب ' || v_category_name || ' في ' || v_area_name || ' الآن! اضغط للتفاصيل.',
    jsonb_build_object('lead_id', NEW.id, 'link', '/dashboard/leads'),
    'lead_new:' || NEW.id::text || ':' || cr.owner_user_id::text
  FROM public.craftsmen cr
  WHERE cr.category_id = NEW.category_id
    AND cr.status = 'approved'
    AND cr.is_published = true
    AND cr.owner_user_id IS NOT NULL
    AND cr.owner_user_id IS DISTINCT FROM NEW.customer_id
  ON CONFLICT (key) DO NOTHING;

  INSERT INTO public.notifications (recipient_id, type, title, body, metadata, key)
  SELECT p.id,
    'admin_alert',
    'طلب خدمة جديد 🆕',
    'تم إنشاء طلب خدمة جديد (' || v_category_name || ') في ' || v_area_name,
    jsonb_build_object('lead_id', NEW.id, 'link', '/admin/leads'),
    'admin_alert:lead:' || NEW.id::text || ':' || p.id::text
  FROM public.profiles p
  WHERE p.role = 'admin'
  ON CONFLICT (key) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_craftsmen_on_new_lead() FROM PUBLIC, anon, authenticated;

-- 2) إشعار التجديد — مجمّع ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.renew_lead(p_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_category_id   UUID;
  v_area_id       UUID;
  v_description   TEXT;
  v_customer      UUID;
  v_category_name TEXT;
  v_area_name     TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT customer_id, category_id, area_id, description
    INTO v_customer, v_category_id, v_area_id, v_description
  FROM public.leads
  WHERE id = p_lead_id AND customer_id = auth.uid() AND status = 'expired'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found, not owned by you, or not expired';
  END IF;

  UPDATE public.leads
  SET status = 'open', expires_at = now() + interval '24 hours'
  WHERE id = p_lead_id;

  SELECT name INTO v_category_name FROM public.categories WHERE id = v_category_id;
  SELECT name INTO v_area_name FROM public.areas WHERE id = v_area_id;

  INSERT INTO public.notifications (recipient_id, type, title, body, metadata, key)
  SELECT DISTINCT cr.owner_user_id,
    'lead_renewed',
    'طلب مُجدَّد متاح 🚨',
    'عاد طلب «' || left(v_description, 60) || '…» متاحاً مجدداً في ' || v_area_name || '.',
    jsonb_build_object('lead_id', p_lead_id, 'link', '/dashboard/leads'),
    'lead_renewed:' || p_lead_id::text || ':' || cr.owner_user_id::text
  FROM public.craftsmen cr
  WHERE cr.category_id = v_category_id
    AND cr.status = 'approved'
    AND cr.is_published = true
    AND cr.owner_user_id IS NOT NULL
    AND cr.owner_user_id IS DISTINCT FROM v_customer
  ON CONFLICT (key) DO NOTHING;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.renew_lead(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.renew_lead(UUID) TO authenticated;

-- 3) ترقيم لوحة الأدمن ---------------------------------------------------------------
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
        OR strpos(lower(l.description), lower(v_search)) > 0
        OR strpos(lower(l.customer_phone), lower(v_search)) > 0
        OR strpos(lower(COALESCE(c.name, '')), lower(v_search)) > 0
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

-- 4) ترقيم لوحتي الصنايعي -----------------------------------------------------------------
-- إسقاط التوقيع القديم بلا وسائط صراحةً (CREATE بتوقيع مختلف ينشئ overload
-- ولا يستبدل — درس 9-fix-2). كل المنادين داخل الريبو يُحدَّثون معها.
DROP FUNCTION IF EXISTS public.get_open_leads_for_me();
DROP FUNCTION IF EXISTS public.get_my_claimed_leads();

CREATE OR REPLACE FUNCTION public.get_open_leads_for_me(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE (
  id             uuid,
  description    text,
  created_at     timestamptz,
  expires_at     timestamptz,
  category_id    uuid,
  category_name  text,
  area_name      text,
  response_count int
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
    (SELECT count(*)::int FROM public.lead_responses lr WHERE lr.lead_id = l.id)
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

CREATE OR REPLACE FUNCTION public.get_my_claimed_leads(p_limit integer DEFAULT 200, p_offset integer DEFAULT 0)
RETURNS TABLE (
  lead_id        uuid,
  description    text,
  customer_phone text,
  status         text,
  created_at     timestamptz,
  claimed_at     timestamptz,
  category_name  text,
  area_name      text
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
    a.name
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

COMMIT;
