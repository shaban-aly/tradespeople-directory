-- =============================================================================
-- 20261005092019_push_anonymous_apikey_gate — بوابة رأس apikey قبل الإرسال
-- =============================================================================
-- نسخة مُحسَّنة من المُرسِل: الفحص يشمل `push_apikey` مع العنوان والمفتاح السري.
-- سابقًا كان الفحص يقتصر على العنوان والمفتاح، فيُطلق الطلب برأس `apikey` فارغ،
-- فترفضه بوابة `send-push` (التي تتحقق من الرأس الثلاثة معاً)، فيبقى الصف عالقاً
-- في processing عشر دقائق مع أن الإرسال كان ممكناً.
--
-- ما يميّز هذه النسخة عن `20261005090531` هو شرط البوابة وحده، وكل ما عداه
-- متطابق: (أ) لا صف جديد ⇒ سبق جدولته ⇒ لا إرسال ثانٍ. (ب) إعدادات ناقصة ⇒
-- يبقى الصف pending ويلتقطه cron. (ج) سقوط pg_net بعد الحجز ⇒ يبقى processing
-- عشر دقائق ثم يستعيده cron بـ FOR UPDATE SKIP LOCKED.
CREATE OR REPLACE FUNCTION public.notify_category_subscribers_on_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cat_slug text;
  v_cat_name text;
  v_follower RECORD;
  v_url text;
  v_apikey text;
  v_secret text;
  v_outbox_id uuid;
  v_lease uuid;
BEGIN
  IF NEW.is_published = true AND NEW.status = 'approved' AND
     (TG_OP = 'INSERT' OR OLD.is_published = false OR OLD.status IS DISTINCT FROM 'approved') THEN

    SELECT slug, name INTO v_cat_slug, v_cat_name
    FROM public.categories
    WHERE id = NEW.category_id;

    IF v_cat_slug IS NULL THEN
      RETURN NEW;
    END IF;

    FOR v_follower IN
      SELECT user_id FROM public.user_interest_subscriptions
      WHERE category_slug = v_cat_slug AND user_id IS DISTINCT FROM NEW.submitted_by
    LOOP
      PERFORM public.create_notification(
        v_follower.user_id,
        'new_craftsman',
        'صنايعي جديد في ' || coalesce(v_cat_name, 'التصنيف') || ' 🛠️',
        '«' || coalesce(NEW.name, 'صنايعي') || '» انضم للدليل حديثاً — تفقد بروفايله وتواصل معه.',
        jsonb_build_object(
          'craftsman_id', NEW.id,
          'slug', NEW.slug,
          'category_slug', v_cat_slug,
          'name', NEW.name,
          'link', '/craftsman/' || coalesce(NEW.slug, '')
        ),
        'cat_interest:' || v_follower.user_id::text || ':' || NEW.id::text
      );
    END LOOP;

    INSERT INTO public.anonymous_push_outbox (
      key, craftsman_id, category_slug, title, body, url, status
    )
    VALUES (
      'anon:' || NEW.id::text || ':' || v_cat_slug,
      NEW.id,
      v_cat_slug,
      'صنايعي جديد في ' || coalesce(v_cat_name, 'الدليل') || ' 🛠️',
      '«' || coalesce(NEW.name, 'صنايعي') || '» انضم لقسم ' || coalesce(v_cat_name, '') || ' — تصفح التفاصيل الآن.',
      '/craftsman/' || coalesce(NEW.slug, ''),
      'pending'
    )
    ON CONFLICT (key) DO NOTHING
    RETURNING id INTO v_outbox_id;

    IF v_outbox_id IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT value INTO v_url    FROM public.push_settings WHERE key = 'push_function_url';
    SELECT value INTO v_apikey FROM public.push_settings WHERE key = 'push_apikey';
    SELECT value INTO v_secret FROM public.push_settings WHERE key = 'push_secret';

    -- نفس شرط `refresh_notification_push_cron`: الإعدادات الثلاثة معاً.
    IF btrim(coalesce(v_url, '')) = ''
       OR btrim(coalesce(v_secret, '')) = ''
       OR btrim(coalesce(v_apikey, '')) = '' THEN
      RETURN NEW;
    END IF;

    v_lease := gen_random_uuid();

    UPDATE public.anonymous_push_outbox
    SET status          = 'processing',
        attempts        = attempts + 1,
        last_attempt_at = now(),
        last_error      = '',
        lease_id        = v_lease
    WHERE id = v_outbox_id;

    PERFORM net.http_post(
      url => v_url,
      body => jsonb_build_object(
        'anonymous_outbox_id', v_outbox_id::text,
        'lease_id',           v_lease::text
      ),
      headers => jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', v_apikey,
        'x-push-secret', v_secret
      ),
      timeout_milliseconds => 5000
    );
  END IF;
  RETURN NEW;
END;
$function$;
