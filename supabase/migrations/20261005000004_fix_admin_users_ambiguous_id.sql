BEGIN;

DROP FUNCTION IF EXISTS public.get_admin_users();
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
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    c.craftsman_id,
    c.craftsman_name,
    c.craftsman_slug,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN LATERAL (
    SELECT cr.id AS craftsman_id, cr.name AS craftsman_name, cr.slug AS craftsman_slug
    FROM public.craftsmen cr
    WHERE cr.owner_user_id = p.id
    ORDER BY cr.created_at DESC
    LIMIT 1
  ) c ON true
  ORDER BY p.created_at DESC;
END;
$$;

COMMIT;
