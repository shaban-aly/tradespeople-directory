-- ============================================================================
-- 20260924191200_craftsman_activity_feed_user_name.sql
-- إضافة اسم المستخدم (user_display_name) إلى دالة get_craftsman_activity_feed
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.get_craftsman_activity_feed(integer);

CREATE OR REPLACE FUNCTION public.get_craftsman_activity_feed(
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  log_id bigint,
  contact_method text,
  user_status text,
  user_display_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_craftsman_id uuid;
BEGIN
  v_craftsman_id := (SELECT public.get_my_craftsman_id());
  IF v_craftsman_id IS NULL THEN
    RETURN;
  END IF;

  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 50 THEN
    p_limit := 20;
  END IF;

  RETURN QUERY
  SELECT 
    l.id AS log_id,
    l.contact_method,
    l.user_status,
    p.display_name AS user_display_name,
    l.created_at
  FROM public.interaction_logs l
  LEFT JOIN public.profiles p ON p.id = l.user_id
  WHERE l.craftsman_id = v_craftsman_id
  ORDER BY l.created_at DESC
  LIMIT p_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_craftsman_activity_feed(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_craftsman_activity_feed(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_craftsman_activity_feed(integer) TO authenticated;

COMMIT;
