-- ============================================================================
-- 20260924190500_admin_users_email.sql
-- دالة get_admin_users لجلب المستخدمين مع البريد الإلكتروني من auth.users
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id uuid,
  display_name text,
  email text,
  avatar_url text,
  role text,
  craftsman_id uuid,
  craftsman_name text,
  craftsman_slug text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'غير مصرح لك بالوصول إلى بيانات المستخدمين';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    u.email::text,
    p.avatar_url,
    p.role,
    p.craftsman_id,
    c.name AS craftsman_name,
    c.slug AS craftsman_slug,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.craftsmen c ON c.id = p.craftsman_id
  ORDER BY p.created_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_users() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

COMMIT;
