-- ============================================================================
-- 20260924184657_activity_feed_user_name.sql
-- إضافة اسم المستخدم (display_name) لـ get_admin_activity_feed RPC
-- ----------------------------------------------------------------------------
-- التغيير: JOIN مع profiles لإرجاع user_display_name بدلاً من "مستخدم مسجل"
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.get_admin_activity_feed(text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_admin_activity_feed(
  p_timeframe text DEFAULT 'today',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  log_id bigint,
  craftsman_id uuid,
  craftsman_name text,
  craftsman_slug text,
  contact_method text,
  user_status text,
  user_display_name text,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_start_time timestamptz;
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'غير مصرح لك بالوصول إلى سجل نشاط المشرف';
  END IF;

  v_start_time := CASE p_timeframe
    WHEN 'week'  THEN now() - interval '7 days'
    WHEN 'month' THEN now() - interval '30 days'
    ELSE date_trunc('day', now())
  END;

  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 200 THEN
    p_limit := 50;
  END IF;
  IF p_offset IS NULL OR p_offset < 0 THEN
    p_offset := 0;
  END IF;

  RETURN QUERY
  SELECT
    l.id            AS log_id,
    c.id            AS craftsman_id,
    c.name          AS craftsman_name,
    c.slug          AS craftsman_slug,
    l.contact_method,
    l.user_status,
    p.display_name  AS user_display_name,
    l.metadata,
    l.created_at
  FROM public.interaction_logs l
  INNER JOIN public.craftsmen c ON c.id = l.craftsman_id
  LEFT JOIN public.profiles p ON p.id = l.user_id
  WHERE l.created_at >= v_start_time
  ORDER BY l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_activity_feed(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_activity_feed(text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_activity_feed(text, integer, integer) TO authenticated;

COMMIT;
