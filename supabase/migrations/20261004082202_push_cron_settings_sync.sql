-- ============================================================================
-- push_cron_settings_sync — مزامنة job إعادة المحاولة مع إعدادات Push
-- ----------------------------------------------------------------------------
-- السبب:
--   في 20261004072615 أُنشئ job إعادة المحاولة مرة واحدة عند أول توفّر
--   للإعدادات فقط (NOT EXISTS guard) بسقف */5 ثابت داخل نصّ الـjob. النتيجة:
--     1) تغيير الفترة من الإعدادات لا يسري — لا مسار يقرأها أصلاً.
--     2) تفرّد الإعدادات (bootstrap بلا مفاتيح) لا يلغي الـjob ⇒ يبقى
--        العامل ينادي رابطاً فارغاً أو سرّاً قديماً بعد تغيّره.
--     3) لا مسار إطلاقاً لتحديث الجدولة بعد تعديل الإعدادات.
--
-- القرار:
--   1) refresh_notification_push_cron(): تُلغي job إعادة المحاولة ثم تُعيد
--      بناءه (أو لا تفعل) حسب حالة الإعدادات الحالية. تجعلها idempotent
--      وقابلة للاستدعاء المتكرر: أي نداء يعكس الحالة الفعلية لا يضاعف job.
--   2) الفترة من الإعدادات: push_retry_interval_minutes (افتراضي 5)،
--      ومقيّدة 1..1440 مع fallback على الافتراضي عند قيمة خارج المدى.
--   3) trigger على push_settings ⇒ أي كتابة تُزامن الجدولة تلقائياً. هذا
--      يغطي POST /api/push/bootstrap (عبر upsert_push_setting) وأي كاتب
--      مستقبلي، فلا يبقى سلوك جدولة معلّق على مسار واحد.
--   4) تفرّد الإعدادات ⇒ لا job إطلاقاً.
--   5) job التنظيف (cleanup) يبقى مستقلاً وبلا مساس: هو متطلب تخزين
--      (حذف صف بعد 7 أيام) ولا علاقة له بإعدادات التوزيع إطلاقاً.
--
-- Idempotent — قابلة لإعادة التطبيق.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PART 1 — مفتاح الفترة + قيوده
-- ----------------------------------------------------------------------------
INSERT INTO public.push_settings (key, value)
VALUES ('push_retry_interval_minutes', '5')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMENT ON TABLE public.push_settings IS
  'إعدادات توزيع FCM — server-only. retry-notification-push-outbox يقرأ الفترة '
  'من هنا عبر refresh_notification_push_cron (المشغَّل بtrigger جدول).';

-- ----------------------------------------------------------------------------
-- PART 2 — refresh_notification_push_cron
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_notification_push_cron()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_jobname constant text := 'retry-notification-push-outbox';
  v_url    text;
  v_apikey text;
  v_secret text;
  v_raw    text;
  v_every  integer;
BEGIN
  -- pg_cron غير مثبَّت ⇒ لا جدولة ولا خطأ (بيئة بلا cron صالحة)
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN jsonb_build_object('action', 'skipped', 'reason', 'pg_cron غير مثبّت');
  END IF;

  SELECT value INTO v_url    FROM public.push_settings WHERE key = 'push_function_url';
  SELECT value INTO v_apikey FROM public.push_settings WHERE key = 'push_apikey';
  SELECT value INTO v_secret FROM public.push_settings WHERE key = 'push_secret';
  SELECT value INTO v_raw    FROM public.push_settings WHERE key = 'push_retry_interval_minutes';

  -- 1) إلغاء أي جدولة سابقة أولاً — يجعل إعادة البناء آمنة مهما تغيّرت
  --    الإعدادات، ويكفل أن تفرّد الإعدادات يُبطل الـjob بدل تركه.
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_jobname) THEN
    PERFORM cron.unschedule(v_jobname);
  END IF;

  -- 2) إعدادات ناقصة ⇒ لا إعادة محاولة (لا رابط، لا سر، لا apikey)
  IF btrim(coalesce(v_url, '')) = ''
     OR btrim(coalesce(v_secret, '')) = ''
     OR btrim(coalesce(v_apikey, '')) = '' THEN
    RETURN jsonb_build_object(
      'action', 'unscheduled',
      'reason', 'إعدادات التوزيع غير مكتملة — أُلغي job إعادة المحاولة');
  END IF;

  -- 3) الفترة من الإعدادات، مقيّدة 1..1440 دقيقة مع fallback
  BEGIN
    v_every := btrim(v_raw)::integer;
  EXCEPTION WHEN others THEN
    v_every := 5;
  END;
  IF v_every IS NULL OR v_every < 1 OR v_every > 1440 THEN
    v_every := 5;
  END IF;

  -- 4) cron.schedule بالاسم = upsert؛ وبما أننا ألغينا أولاً فالنتيجة واحدة
  --    لا صفّان بنفس الاسم مهما تكرّر النداء.
  PERFORM cron.schedule(
    v_jobname,
    format('*/%s * * * *', v_every),
    format(
      $job$SELECT net.http_post(url := %L, body := '{}'::jsonb, headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', %L, 'x-push-secret', %L), timeout_milliseconds := 30000)$job$,
      v_url, v_apikey, v_secret
    )
  );

  RETURN jsonb_build_object(
    'action', 'scheduled',
    'jobname', v_jobname,
    'every_minutes', v_every);
END;
$function$;

REVOKE ALL ON FUNCTION public.refresh_notification_push_cron() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- PART 3 — trigger المزامنة على كل كتابة في push_settings
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_push_cron_after_settings_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- بعد الحفظ دائماً: يعكس upsert_push_setting و DELETE المباشر معاً.
  PERFORM public.refresh_notification_push_cron();
  RETURN COALESCE(NEW, OLD);
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_push_cron_after_settings_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_push_cron ON public.push_settings;

CREATE TRIGGER trg_sync_push_cron
AFTER INSERT OR UPDATE OR DELETE ON public.push_settings
FOR EACH STATEMENT
EXECUTE FUNCTION public.sync_push_cron_after_settings_change();

-- statement-level: استدعاء واحد لكل جملة كتابة، لا لكل صف (الجدول صغير
-- والإعدادات handful من المفاتيح، فالفرق لا يبرّر تكرار الجدولة).

-- ----------------------------------------------------------------------------
-- PART 4 — توسيع القائمة البيضاء في upsert_push_setting + التحقق من الفترة
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_push_setting(p_key text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_every integer;
BEGIN
  -- القائمة البيضاء: مفتاح جديد + المفاتيح الثلاثة القائمة
  IF p_key NOT IN ('push_function_url', 'push_apikey', 'push_secret',
                   'push_retry_interval_minutes') THEN
    RETURN;
  END IF;

  -- التنفيذ مسموح لـauthenticated لأن POST /api/push/bootstrap يستدعي هذه
  -- الدالة عبر جلسة المشرف (لا يوجد service-role client في هذا المسار).
  -- ⇒ الفحص يكون هنا لا في المسار، وإلا كفى أي مستخدم مسجّل استدعاء
  -- الدالة مباشرة عبر PostgREST فيكتب apikey/secret من اختياره ويقرأ السر
  -- المشترك على_trigger و pg_cron. و auth.uid() IS NULL يعني استدعاءً داخلياً
  -- (service_role / أثناء migration) ويمر بلا فحص.
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role = 'admin'
     ) THEN
    RETURN;
  END IF;

  -- قيمة الفترة تُقيَّد هنا أيضاً (غير الـtrigger): عميل يمرّر رقماً خارج
  -- المدى لا يصل أصلاً إلى القاعدة، ودالة server-only بلا عملاء.
  IF p_key = 'push_retry_interval_minutes' THEN
    BEGIN
      v_every := btrim(coalesce(p_value, ''))::integer;
    EXCEPTION WHEN others THEN
      v_every := 5;
    END;
    IF v_every < 1 OR v_every > 1440 THEN
      v_every := 5;
    END IF;
    p_value := v_every::text;
  END IF;

  INSERT INTO public.push_settings (key, value)
  VALUES (p_key, p_value)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  -- المزامنة يتمّها trg_sync_push_cron تلقائياً بعد هذا الـINSERT.
END;
$function$;

-- ----------------------------------------------------------------------------
-- PART 5 — استبدال fail-stale بمعيار device-scoped
-- ----------------------------------------------------------------------------
-- job «إسقاط القديم» كان يستخدم attempts >= 6 على صف outbox. بعد deliveries
-- صار attempts عدّاد دورات تجميعي، فالقاعدة الجديدة تُسقط الصف فقط حين
-- لا delivery قابلة لإعادة محاولة — أي احتهى كل جهاز (sent/invalid/
-- exhausted). ولمّا كانت هناك deliveries معلّقة طويلة فلا نلمس الصف.
DO $$
DECLARE
  v_cmd constant text :=
    $cmd$UPDATE public.notification_push_outbox o
        SET status = 'failed',
            last_error = 'stale: no device retry left',
            lease_id = NULL
      WHERE o.status IN ('pending', 'processing')
        AND o.created_at < now() - interval '2 days'
        AND NOT EXISTS (
          SELECT 1 FROM public.notification_push_deliveries d
          WHERE d.outbox_id = o.id AND d.status = 'pending'
        )
        AND o.id IN (SELECT outbox_id FROM public.notification_push_deliveries)$cmd$;
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fail-stale-notification-push-outbox') THEN
    PERFORM cron.unschedule('fail-stale-notification-push-outbox');
  END IF;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'fail-stale-notification-push-outbox',
      '*/30 * * * *',
      v_cmd
    );
  END IF;
END $$;

-- استعادة الصفوف المعلّقة في processing (lease منتهٍ): لم يكن هناك job
-- ينادي drain_stale_push_outbox إطلاقاً، فكانت الاستعادة تعتمد حصرياً على
-- شرط العشر دقائق داخل claim. نحتاج ذلك كل عشر دقائق أيضاً لأداء drain
-- على مستوى الـdeliveries (تصفير موعدها).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'drain-notification-push-outbox') THEN
    PERFORM cron.schedule(
      'drain-notification-push-outbox',
      '*/10 * * * *',
      'SELECT public.drain_stale_push_outbox()'
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PART 6 — تطبيق الجدولة على الحالة الحالية (لا job معلق خلف migration)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM public.refresh_notification_push_cron();
END $$;

COMMIT;