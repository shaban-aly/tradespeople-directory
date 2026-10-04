-- 20261005000000_multicraftsman_ownership.sql - Multiple craftsman ownership
BEGIN;

-- 1. Add owner_user_id to craftsmen
ALTER TABLE public.craftsmen 
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS craftsmen_owner_user_id_idx ON public.craftsmen (owner_user_id);

-- 2. Migrate existing data
UPDATE public.craftsmen c
SET owner_user_id = p.id
FROM public.profiles p
WHERE p.craftsman_id = c.id
  AND c.owner_user_id IS NULL;

UPDATE public.craftsmen c
SET owner_user_id = c.submitted_by
WHERE c.owner_user_id IS NULL
  AND c.submitted_by IS NOT NULL;

-- 3. Update uniqueness constraint
DROP INDEX IF EXISTS craftsmen_pending_submitted_unique;

CREATE UNIQUE INDEX IF NOT EXISTS craftsmen_owner_category_pending_approved_unique
  ON public.craftsmen (owner_user_id, category_id)
  WHERE owner_user_id IS NOT NULL
    AND status IN ('pending', 'approved');

-- 4. Create sync_craftsman_role function
CREATE OR REPLACE FUNCTION public.sync_craftsman_role(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'admin') THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.craftsmen WHERE owner_user_id = p_user_id AND status = 'approved') THEN
    UPDATE public.profiles SET role = 'craftsman' WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles SET role = 'client' WHERE id = p_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_craftsman_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_craftsman_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_craftsman_role(uuid) FROM authenticated;

-- 5. Update guard function
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
      WHERE craftsman_id IS NOT NULL AND craftsman_id = NEW.id;
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
    WHERE craftsman_id IS NOT NULL AND craftsman_id = NEW.id;
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

-- 6. Update approve_craftsman_application
CREATE OR REPLACE FUNCTION public.approve_craftsman_application(p_craftsman_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_craftsman public.craftsmen;
  v_slug      text;
  v_attempt   int := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_craftsman FROM public.craftsmen WHERE id = p_craftsman_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Craftsman not found'; END IF;
  IF v_craftsman.status <> 'pending' THEN RAISE EXCEPTION 'Application not pending'; END IF;
  IF v_craftsman.name IS NULL OR v_craftsman.category_id IS NULL OR v_craftsman.area_id IS NULL OR v_craftsman.phone IS NULL THEN
    RAISE EXCEPTION 'Missing required fields';
  END IF;
  IF v_craftsman.owner_user_id IS NULL THEN RAISE EXCEPTION 'Owner user not set'; END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_slug := lower(regexp_replace(v_craftsman.name, '[^a-z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    IF length(v_slug) < 3 THEN v_slug := 'craftsman'; END IF;
    v_slug := v_slug || '-' || substr(md5(gen_random_uuid()::text), 1, 8);
    BEGIN
      UPDATE public.craftsmen SET status = 'approved', is_published = true, slug = v_slug WHERE id = p_craftsman_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 5 THEN RAISE EXCEPTION 'Could not generate slug'; END IF;
    END;
  END LOOP;

  PERFORM public.sync_craftsman_role(v_craftsman.owner_user_id);
  RETURN p_craftsman_id;
END;
$$;

-- 7. Update link_craftsman_user
CREATE OR REPLACE FUNCTION public.link_craftsman_user(
  craftsman_id_input uuid,
  user_email_input text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_craftsman public.craftsmen;
  v_old_owner uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(user_email_input);
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  SELECT * INTO v_craftsman FROM public.craftsmen WHERE id = craftsman_id_input FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Craftsman not found'; END IF;
  v_old_owner := v_craftsman.owner_user_id;
  IF EXISTS (
    SELECT 1 FROM public.craftsmen
    WHERE owner_user_id = v_user_id AND category_id = v_craftsman.category_id AND status = 'approved' AND id != craftsman_id_input
  ) THEN
    RAISE EXCEPTION 'Target user already has approved craftsman in same category';
  END IF;
  UPDATE public.craftsmen SET owner_user_id = v_user_id WHERE id = craftsman_id_input;
  PERFORM public.sync_craftsman_role(v_user_id);
  IF v_old_owner IS NOT NULL AND v_old_owner != v_user_id THEN
    PERFORM public.sync_craftsman_role(v_old_owner);
  END IF;
  RETURN true;
END;
$$;

-- 8. Drop old structures from profiles
DROP INDEX IF EXISTS profiles_craftsman_id_key;
DROP TRIGGER IF EXISTS trg_notify_account_linked ON public.profiles;
DROP FUNCTION IF EXISTS public.notify_account_linked();
ALTER TABLE public.profiles DROP COLUMN IF EXISTS craftsman_id;

COMMIT;
