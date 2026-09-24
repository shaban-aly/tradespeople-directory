-- ============================================================================
-- 0026_isr_webhook_triggers.sql — On-demand ISR Revalidation عبر pg_net
-- ----------------------------------------------------------------------------
-- ينشئ:
--   1) دالة notify_vercel_webhook() — تُرسل HTTP POST إلى /api/webhooks/supabase
--      عند أي تغيير في craftsmen / categories / areas / reviews.
--   2) Trigger على كل جدول يستدعي الدالة بعد INSERT/UPDATE/DELETE.
--
-- المتغيرات:
--   - WEBHOOK_URL   : يُقرأ من app.settings.vercel_webhook_url
--   - WEBHOOK_SECRET: يُقرأ من app.settings.supabase_webhook_secret
--   كلا المتغيرين يُضبطان بعد التطبيق عبر:
--     ALTER DATABASE postgres SET app.settings.vercel_webhook_url = '...';
--     ALTER DATABASE postgres SET app.settings.supabase_webhook_secret = '...';
-- ============================================================================

BEGIN;

-- ==================== الدالة المركزية ==========================

CREATE OR REPLACE FUNCTION public.notify_vercel_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  -- ⚠️ عدّل القيمتين دول عند تغيير الـ domain أو السر
  v_url    constant text := 'https://sanay.daleel-al-suez.com/api/webhooks/supabase';
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

-- ==================== Triggers على الجداول ====================

-- craftsmen
DROP TRIGGER IF EXISTS trg_isr_craftsmen ON public.craftsmen;
CREATE TRIGGER trg_isr_craftsmen
  AFTER INSERT OR UPDATE OR DELETE ON public.craftsmen
  FOR EACH ROW EXECUTE FUNCTION public.notify_vercel_webhook();

-- categories
DROP TRIGGER IF EXISTS trg_isr_categories ON public.categories;
CREATE TRIGGER trg_isr_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.notify_vercel_webhook();

-- areas
DROP TRIGGER IF EXISTS trg_isr_areas ON public.areas;
CREATE TRIGGER trg_isr_areas
  AFTER INSERT OR UPDATE OR DELETE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION public.notify_vercel_webhook();

-- reviews (UPDATE و DELETE فقط — INSERT يأتي من المستخدم ومُعالج بالـ reviews trigger)
DROP TRIGGER IF EXISTS trg_isr_reviews ON public.reviews;
CREATE TRIGGER trg_isr_reviews
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_vercel_webhook();

-- ==================== ضبط الإعدادات الافتراضية ================
-- ⚠️  استبدل القيم دي بعد التطبيق مباشرةً:
--
--   ALTER DATABASE postgres
--     SET "app.settings.vercel_webhook_url" = 'https://your-domain.vercel.app/api/webhooks/supabase';
--
--   ALTER DATABASE postgres
--     SET "app.settings.supabase_webhook_secret" = '0fcab2f9b6120e5ee194c3c740587482e1a1ae94dcafcf3b57b498e0b050f6c8';
--
-- ثم شغّل: SELECT pg_reload_conf();
-- أو بديلاً من Supabase Dashboard: SQL Editor → شغّل الأوامر دي.
-- =====================================================================

COMMIT;
