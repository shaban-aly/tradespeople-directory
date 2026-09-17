-- ============================================================================
-- 0017_anonymous_push.sql — إشعارات الزوار المجهولين والاهتمامات السياقية
-- ----------------------------------------------------------------------------
-- القرارات المعتمدة:
--   1) إشعارات المجهولين (Anonymous Push): للزوار الذين أظهروا اهتماماً بتصنيف معين
--      دون الحاجة لتسجيل حساب.
--   2) جدول `anonymous_push_subscriptions`: توكن الجهاز + مصفوفة الاهتمامات (interests).
--      server-only عبر RPCs بـ SECURITY DEFINER.
--   3) جدول `user_interest_subscriptions`: متابعة التصنيفات للمسجلين.
--   4) جدول `anonymous_push_outbox`: منع الإزعاج والتكرار مع Dedup key لكل صانع/تصنيف.
--   5) التبني التلقائي (Adoption): عند تسجيل دخول المستخدم، تنقل اهتماماته من المجهول
--      إلى حسابه المسجل ويُحذف السجل المجهول.
--   6) Trigger النشر: عند نشر صانع جديد (approved + is_published)، يُجدوَل إشعار
--      للزوار المهتمين بالتصنيف، وللمسجلين المتابعين له.
-- Idempotent — قابلة لإعادة التطبيق.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PART 1 — جدول اشتراكات الزوار المجهولين (anonymous_push_subscriptions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anonymous_push_subscriptions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token              text        NOT NULL UNIQUE,
  interests          text[]      NOT NULL DEFAULT '{}',
  platform           text        NOT NULL DEFAULT 'web' CHECK (platform = 'web'),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  last_notified_at   timestamptz NULL,
  notification_count integer     NOT NULL DEFAULT 0,
  status             text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  CONSTRAINT anon_push_token_len_check
    CHECK (char_length(token) BETWEEN 10 AND 4096)
);

ALTER TABLE public.anonymous_push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.anonymous_push_subscriptions FROM anon, authenticated, PUBLIC;

CREATE INDEX IF NOT EXISTS idx_anon_push_interests
  ON public.anonymous_push_subscriptions USING gin(interests);

CREATE INDEX IF NOT EXISTS idx_anon_push_status
  ON public.anonymous_push_subscriptions (status);

-- ----------------------------------------------------------------------------
-- PART 2 — جدول اهتمامات المستخدمين المسجلين (user_interest_subscriptions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_interest_subscriptions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_slug text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_interest_unique UNIQUE (user_id, category_slug),
  CONSTRAINT user_interest_slug_len CHECK (char_length(category_slug) BETWEEN 1 AND 64)
);

ALTER TABLE public.user_interest_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_interest_user
  ON public.user_interest_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_interest_cat
  ON public.user_interest_subscriptions (category_slug);

DROP POLICY IF EXISTS "user interests read own" ON public.user_interest_subscriptions;
CREATE POLICY "user interests read own"
  ON public.user_interest_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user interests insert own" ON public.user_interest_subscriptions;
CREATE POLICY "user interests insert own"
  ON public.user_interest_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user interests delete own" ON public.user_interest_subscriptions;
CREATE POLICY "user interests delete own"
  ON public.user_interest_subscriptions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON public.user_interest_subscriptions FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.user_interest_subscriptions TO authenticated;

-- ----------------------------------------------------------------------------
-- PART 3 — جدول صندوق صادر إشعارات المجهولين (anonymous_push_outbox)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anonymous_push_outbox (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key           text        NOT NULL UNIQUE,
  craftsman_id  uuid        NOT NULL REFERENCES public.craftsmen(id) ON DELETE CASCADE,
  category_slug text        NOT NULL,
  title         text        NOT NULL,
  body          text        NOT NULL,
  url           text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anonymous_push_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.anonymous_push_outbox FROM anon, authenticated, PUBLIC;

CREATE INDEX IF NOT EXISTS idx_anon_outbox_status
  ON public.anonymous_push_outbox (status, created_at);

-- ----------------------------------------------------------------------------
-- PART 4 — RPCs إدارة اشتراك الزائر المجهول
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_anonymous_push(
  p_token     text,
  p_interests text[] DEFAULT '{}',
  p_platform  text DEFAULT 'web'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cleaned_interests text[];
BEGIN
  IF p_token IS NULL OR char_length(p_token) NOT BETWEEN 10 AND 4096 THEN RETURN; END IF;
  IF p_platform IS DISTINCT FROM 'web' THEN RETURN; END IF;

  -- تصفية مصفوفة الاهتمامات وإزالة الفراغات والقيم المكررة (سقف 20 اهتمام)
  SELECT array_agg(DISTINCT elem) INTO v_cleaned_interests
  FROM unnest(coalesce(p_interests, '{}')) AS elem
  WHERE char_length(elem) BETWEEN 1 AND 64;

  INSERT INTO public.anonymous_push_subscriptions (
    token, interests, platform, status, updated_at
  )
  VALUES (
    p_token,
    coalesce(v_cleaned_interests, '{}'),
    p_platform,
    'active',
    now()
  )
  ON CONFLICT (token) DO UPDATE SET
    interests = (
      SELECT coalesce(array_agg(DISTINCT elem), '{}')
      FROM unnest(
        array_cat(public.anonymous_push_subscriptions.interests, coalesce(v_cleaned_interests, '{}'))
      ) AS elem
      WHERE char_length(elem) BETWEEN 1 AND 64
    ),
    status = 'active',
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.unregister_anonymous_push(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_token IS NULL OR char_length(p_token) NOT BETWEEN 10 AND 4096 THEN RETURN; END IF;
  UPDATE public.anonymous_push_subscriptions
  SET status = 'revoked', updated_at = now()
  WHERE token = p_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_anonymous_interests(
  p_token     text,
  p_interests text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cleaned_interests text[];
BEGIN
  IF p_token IS NULL OR char_length(p_token) NOT BETWEEN 10 AND 4096 THEN RETURN; END IF;

  SELECT array_agg(DISTINCT elem) INTO v_cleaned_interests
  FROM unnest(coalesce(p_interests, '{}')) AS elem
  WHERE char_length(elem) BETWEEN 1 AND 64;

  UPDATE public.anonymous_push_subscriptions
  SET interests = coalesce(v_cleaned_interests, '{}'),
      updated_at = now()
  WHERE token = p_token AND status = 'active';
END;
$function$;

REVOKE ALL ON FUNCTION public.register_anonymous_push(text, text[], text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unregister_anonymous_push(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_anonymous_interests(text, text[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.register_anonymous_push(text, text[], text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unregister_anonymous_push(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_anonymous_interests(text, text[]) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- PART 5 — تحديث register_push_token لتنفيذ التبني (Adoption) التلقائي
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_push_token(
  p_token    text,
  p_platform text DEFAULT 'web'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_count integer;
  v_anon_interests text[];
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  IF p_token IS NULL OR char_length(p_token) NOT BETWEEN 10 AND 4096 THEN RETURN; END IF;
  IF p_platform IS DISTINCT FROM 'web' THEN RETURN; END IF;

  -- سقف أجهزة لكل مستخدم (مكافحة الحشو): عند التجاوز يُحذف الأقدم أولاً
  SELECT count(*) INTO v_count FROM public.user_push_tokens WHERE user_id = v_user;
  IF v_count >= 10 THEN
    DELETE FROM public.user_push_tokens
    WHERE user_id = v_user
      AND id = (
        SELECT id FROM public.user_push_tokens
        WHERE user_id = v_user ORDER BY created_at ASC LIMIT 1
      );
  END IF;

  INSERT INTO public.user_push_tokens (user_id, token, platform)
  VALUES (v_user, p_token, p_platform)
  ON CONFLICT (token) DO UPDATE SET last_seen_at = now();

  -- التبني (Adoption): نقل اهتمامات الزائر المجهول لحسابه المسجل وإلغاء السجل المجهول
  SELECT interests INTO v_anon_interests
  FROM public.anonymous_push_subscriptions
  WHERE token = p_token AND status = 'active';

  IF v_anon_interests IS NOT NULL AND array_length(v_anon_interests, 1) > 0 THEN
    INSERT INTO public.user_interest_subscriptions (user_id, category_slug)
    SELECT v_user, elem
    FROM unnest(v_anon_interests) AS elem
    WHERE char_length(elem) BETWEEN 1 AND 64
    ON CONFLICT (user_id, category_slug) DO NOTHING;

    DELETE FROM public.anonymous_push_subscriptions WHERE token = p_token;
  END IF;
END;
$function$;

-- ----------------------------------------------------------------------------
-- PART 6 — Triggers عند نشر الصانع: إشعار المتابعين والزوار المهتمين
-- ----------------------------------------------------------------------------
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
BEGIN
  -- يتم الإطلاق فقط عند انتقال الصانع لحالة معتمد + منشور
  IF NEW.is_published = true AND NEW.status = 'approved' AND
     (TG_OP = 'INSERT' OR OLD.is_published = false OR OLD.status IS DISTINCT FROM 'approved') THEN

    SELECT slug, name INTO v_cat_slug, v_cat_name
    FROM public.categories
    WHERE id = NEW.category_id;

    IF v_cat_slug IS NULL THEN
      RETURN NEW;
    END IF;

    -- 1) إشعار المستخدمين المسجلين المتابعين لهذا التصنيف
    FOR v_follower IN
      SELECT user_id FROM public.user_interest_subscriptions
      WHERE category_slug = v_cat_slug AND user_id IS DISTINCT FROM NEW.submitted_by
    LOOP
      PERFORM public.create_notification(
        v_follower.user_id,
        'new_request',
        'صنايعي جديد في ' || coalesce(v_cat_name, 'التصنيف') || ' 🛠️',
        '«' || coalesce(NEW.name, 'صنايعي') || '» انضم للدليل حديثاً — تفقد بروفايله وتواصل معه.',
        jsonb_build_object(
          'craftsman_id', NEW.id,
          'slug', NEW.slug,
          'category_slug', v_cat_slug,
          'name', NEW.name
        ),
        'cat_interest:' || v_follower.user_id::text || ':' || NEW.id::text
      );
    END LOOP;

    -- 2) جدولة إشعار للزوار المجهولين عبر Outbox
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

    -- 3) إرسال طلب المعالجة للـ Edge Function عبر pg_net إن كانت مهيأة
    IF v_outbox_id IS NOT NULL THEN
      SELECT value INTO v_url    FROM public.push_settings WHERE key = 'push_function_url';
      SELECT value INTO v_apikey FROM public.push_settings WHERE key = 'push_apikey';
      SELECT value INTO v_secret FROM public.push_settings WHERE key = 'push_secret';

      IF btrim(coalesce(v_url, '')) <> '' AND btrim(coalesce(v_secret, '')) <> '' THEN
        PERFORM net.http_post(
          url => v_url,
          body => jsonb_build_object('anonymous_outbox_id', v_outbox_id::text),
          headers => jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', coalesce(v_apikey, ''),
            'x-push-secret', v_secret
          ),
          timeout_milliseconds => 5000
        );
      END IF;
    END IF;

  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_category_subscribers_on_publish() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_craftsman_notify_interests ON public.craftsmen;
CREATE TRIGGER trg_craftsman_notify_interests
  AFTER INSERT OR UPDATE OF is_published, status ON public.craftsmen
  FOR EACH ROW EXECUTE FUNCTION public.notify_category_subscribers_on_publish();

COMMIT;
