BEGIN;

-- 1. Fix guard_craftsman_owner_update
CREATE OR REPLACE FUNCTION public.guard_craftsman_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin() THEN
    IF NEW.name IS DISTINCT FROM OLD.name AND NEW.name IS NOT NULL THEN
      UPDATE public.profiles
      SET display_name = trim(NEW.name)
      WHERE id = NEW.owner_user_id;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.image_url IS NOT NULL
     AND NEW.image_url IS DISTINCT FROM OLD.image_url
     AND NEW.image_url NOT LIKE '%/object/public/craftsman-images/craftsmen/' || NEW.id::text || '/%' THEN
    RAISE EXCEPTION 'Invalid image path'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.name IS DISTINCT FROM OLD.name THEN
    IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 OR length(NEW.name) > 60 THEN
      RAISE EXCEPTION 'Invalid name'
      USING ERRCODE = '23514';
    END IF;
    UPDATE public.profiles
    SET display_name = trim(NEW.name)
    WHERE id = NEW.owner_user_id;
  END IF;

  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.is_published IS DISTINCT FROM OLD.is_published
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.category_id IS DISTINCT FROM OLD.category_id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by
     OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
    RAISE EXCEPTION 'Cannot modify restricted fields';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Drop dependent policies first
DROP POLICY IF EXISTS "craftsmen craftsman update own" ON public.craftsmen;
DROP POLICY IF EXISTS "craftsmen craftsman read own" ON public.craftsmen;
DROP POLICY IF EXISTS "craftsman-images owner upload" ON storage.objects;
DROP POLICY IF EXISTS "craftsman_stats craftsman read own" ON public.craftsman_stats;
DROP POLICY IF EXISTS "craftsman_stats_daily craftsman read own" ON public.craftsman_stats_daily;
DROP POLICY IF EXISTS "interaction_logs craftsman read own" ON public.interaction_logs;

-- Also drop other old policies that we might redefine just in case
DROP POLICY IF EXISTS "Craftsmen are viewable by everyone if published" ON public.craftsmen;
DROP POLICY IF EXISTS "Craftsmen can view their own profile" ON public.craftsmen;
DROP POLICY IF EXISTS "Craftsmen can update their own profile" ON public.craftsmen;
DROP POLICY IF EXISTS "Users can view their submitted applications" ON public.craftsmen;
DROP POLICY IF EXISTS "Craftsman stats are viewable by everyone if published" ON public.craftsman_stats;
DROP POLICY IF EXISTS "Craftsmen can view their own stats" ON public.craftsman_stats;
DROP POLICY IF EXISTS "Craftsmen can update their own stats" ON public.craftsman_stats;
DROP POLICY IF EXISTS "Anyone can update stats" ON public.craftsman_stats;
DROP POLICY IF EXISTS "Craftsmen can view their own daily stats" ON public.craftsman_stats_daily;
DROP POLICY IF EXISTS "Craftsmen can view their own interaction logs" ON public.interaction_logs;

-- Now safe to drop get_my_craftsman_id
DROP FUNCTION IF EXISTS public.get_my_craftsman_id();

-- 3. Fix RLS on craftsmen
CREATE POLICY "Craftsmen are viewable by everyone if published"
  ON public.craftsmen FOR SELECT
  USING (is_published = true AND status = 'approved');

CREATE POLICY "Users can view their owned profiles"
  ON public.craftsmen FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can update their owned profiles"
  ON public.craftsmen FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can view their submitted applications"
  ON public.craftsmen FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

-- 4. Fix RLS on craftsman_stats
CREATE POLICY "Craftsman stats are viewable by everyone if published"
  ON public.craftsman_stats FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.craftsmen c WHERE c.id = craftsman_stats.craftsman_id AND c.is_published = true));

CREATE POLICY "Users can view stats of their owned craftsmen"
  ON public.craftsman_stats FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.craftsmen c WHERE c.id = craftsman_stats.craftsman_id AND c.owner_user_id = auth.uid()));

CREATE POLICY "Users can update stats of their owned craftsmen"
  ON public.craftsman_stats FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.craftsmen c WHERE c.id = craftsman_stats.craftsman_id AND c.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.craftsmen c WHERE c.id = craftsman_stats.craftsman_id AND c.owner_user_id = auth.uid()));

-- 5. Fix RLS on craftsman_stats_daily
CREATE POLICY "Users can view daily stats of their owned craftsmen"
  ON public.craftsman_stats_daily FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.craftsmen c WHERE c.id = craftsman_stats_daily.craftsman_id AND c.owner_user_id = auth.uid()));

-- 6. Fix RLS on interaction_logs
CREATE POLICY "Users can view interaction logs of their owned craftsmen"
  ON public.interaction_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.craftsmen c WHERE c.id = interaction_logs.craftsman_id AND c.owner_user_id = auth.uid()));

-- 7. Fix get_craftsman_activity_feed RPC
CREATE OR REPLACE FUNCTION public.get_craftsman_activity_feed(
  p_craftsman_id uuid DEFAULT NULL,
  p_limit int DEFAULT 20
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
AS $$
BEGIN
  IF NOT public.is_admin() AND NOT EXISTS (
    SELECT 1 FROM public.craftsmen WHERE id = p_craftsman_id AND owner_user_id = auth.uid()
  ) THEN
    RETURN;
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
  WHERE l.craftsman_id = p_craftsman_id
  ORDER BY l.created_at DESC
  LIMIT p_limit;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_craftsman_activity_feed(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_craftsman_activity_feed(uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_craftsman_activity_feed(uuid, int) TO authenticated;

-- 8. Fix increment_craftsman_stats
CREATE OR REPLACE FUNCTION public.increment_craftsman_stats(p_craftsman_id uuid, p_column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_viewer_id uuid;
  v_owner_user_id uuid;
BEGIN
  v_viewer_id := auth.uid();
  
  IF v_viewer_id IS NOT NULL THEN
    SELECT owner_user_id INTO v_owner_user_id FROM public.craftsmen WHERE id = p_craftsman_id;
    IF v_viewer_id = v_owner_user_id THEN
      RETURN;
    END IF;
  END IF;

  IF p_column_name = 'views' THEN
    UPDATE public.craftsman_stats
    SET views = views + 1
    WHERE craftsman_id = p_craftsman_id;
  ELSIF p_column_name = 'calls' THEN
    UPDATE public.craftsman_stats
    SET calls = calls + 1
    WHERE craftsman_id = p_craftsman_id;
  ELSIF p_column_name = 'whatsapp' THEN
    UPDATE public.craftsman_stats
    SET whatsapp = whatsapp + 1
    WHERE craftsman_id = p_craftsman_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_craftsman_stats(uuid, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_craftsman_stats(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_craftsman_stats(uuid, text) TO authenticated;

-- 9. Storage policy fix
CREATE POLICY "craftsman-images owner upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'craftsman-images'
    AND (storage.foldername(name))[1] = 'craftsmen'
    AND EXISTS (
      SELECT 1 FROM public.craftsmen 
      WHERE id::text = (storage.foldername(name))[2]
      AND owner_user_id = auth.uid()
    )
  );

COMMIT;
