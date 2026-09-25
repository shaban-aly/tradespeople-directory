-- ============================================================================
-- Update ISR Webhook URL with new domain
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_vercel_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_url    constant text := 'https://daleel-al-suez.com/api/webhooks/supabase';
  v_secret constant text := '0fcab2f9b6120e5ee194c3c740587482e1a1ae94dcafcf3b57b498e0b050f6c8';
  v_payload jsonb;
BEGIN
  v_payload := jsonb_build_object(
    'type',       TG_OP,
    'table',      TG_TABLE_NAME,
    'record',     to_jsonb(NEW),
    'old_record', to_jsonb(OLD)
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
