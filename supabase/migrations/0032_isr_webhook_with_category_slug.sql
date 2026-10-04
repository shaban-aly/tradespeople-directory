-- ============================================================================
-- 0032_isr_webhook_with_category_slug.sql
-- إضافة category_slug للـ webhook payload لدعم الإبطال الدقيق per-category
-- ============================================================================

BEGIN;

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

  v_payload := jsonb_build_object(
    'type',          TG_OP,
    'table',         TG_TABLE_NAME,
    'record',        to_jsonb(NEW),
    'old_record',    to_jsonb(OLD),
    'category_slug', v_category_slug,
    'old_category_slug', v_old_category_slug
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
