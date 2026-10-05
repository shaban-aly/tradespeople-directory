BEGIN;

-- 1. P1 Fix: Protect craftsmen insert policy to enforce owner_user_id
DROP POLICY IF EXISTS "craftsmen applicant insert pending" ON public.craftsmen;
CREATE POLICY "craftsmen applicant insert pending"
  ON public.craftsmen FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending'
    AND is_published = false
    AND verified = false
    AND submitted_by = auth.uid()
    AND owner_user_id = auth.uid()
    AND slug IS NULL
  );

-- 2. P2 Fix: Decouple profiles.display_name from craftsmen.name updates
CREATE OR REPLACE FUNCTION public.guard_craftsman_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin() THEN
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

-- 3. P2 Fix: Webhook payload should include craftsman_slug for reviews and stats
CREATE OR REPLACE FUNCTION public.notify_vercel_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_url    text;
  v_secret text;
  v_payload jsonb;
  v_category_slug text;
  v_old_category_slug text;
  v_craftsman_slug text;
BEGIN
  -- استخدام الإعدادات إذا وجدت، أو القيم الافتراضية كخيار احتياطي
  v_url := COALESCE(current_setting('app.settings.vercel_webhook_url', true), 'https://sanay.daleel-al-suez.com/api/webhooks/supabase');
  v_secret := COALESCE(current_setting('app.settings.supabase_webhook_secret', true), '0fcab2f9b6120e5ee194c3c740587482e1a1ae94dcafcf3b57b498e0b050f6c8');

  -- جلب category_slug من جدول categories عند التعامل مع craftsmen
  IF TG_TABLE_NAME = 'craftsmen' THEN
    IF NEW.category_id IS NOT NULL THEN
      SELECT slug INTO v_category_slug FROM public.categories WHERE id = NEW.category_id;
    END IF;
    
    IF OLD.category_id IS NOT NULL AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      SELECT slug INTO v_old_category_slug FROM public.categories WHERE id = OLD.category_id;
    END IF;
  END IF;

  -- جلب craftsman_slug إذا كان الجدول مرتبطاً בצنايعي (Reviews, Stats)
  IF TG_TABLE_NAME IN ('reviews', 'craftsman_stats') THEN
    IF NEW.craftsman_id IS NOT NULL THEN
      SELECT slug INTO v_craftsman_slug FROM public.craftsmen WHERE id = NEW.craftsman_id;
    ELSIF OLD.craftsman_id IS NOT NULL THEN
      SELECT slug INTO v_craftsman_slug FROM public.craftsmen WHERE id = OLD.craftsman_id;
    END IF;
  END IF;

  v_payload := jsonb_build_object(
    'type',          TG_OP,
    'table',         TG_TABLE_NAME,
    'record',        to_jsonb(NEW),
    'old_record',    to_jsonb(OLD),
    'category_slug', v_category_slug,
    'old_category_slug', v_old_category_slug,
    'craftsman_slug', v_craftsman_slug
  );

  PERFORM net.http_post(
    url     => v_url,
    headers => jsonb_build_object(
      'Content-Type',     'application/json',
      'x-webhook-secret', v_secret
    ),
    body    => v_payload
  );

  RETURN coalesce(NEW, OLD);
END;
$function$;

COMMIT;
