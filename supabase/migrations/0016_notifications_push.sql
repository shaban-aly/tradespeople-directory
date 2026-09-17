-- ============================================================================
-- 0016_notifications_push.sql — المرحلة 9 (تتمة): Firebase Cloud Messaging (Push)
-- ----------------------------------------------------------------------------
-- القرارات المعتمدة:
--   1) التوصيل: لا نعتمد على التطبيق (الموقع) إطلاقاً — الإشعار يصل حتى لو كان
--      الموقع مقفولاً. الطبقة: **pg_net** (تفعيل الامتداد) يستدعي Edge Function
--      `send-push` عند كل إدراج notification → FCM HTTP v1.
--      (pg_net/http كانا غير مفعّلين في الـ live — يُفعَّل pg_net هنا عبر السلسلة).
--   2) أجهزة المستخدم: جدول `user_push_tokens` — لا إدراج من العميل مباشرة؛
--      RPC `register_push_token`/`unregister_push_token` SECURITY DEFINER يثبّت
--      user_id سيرفراً (auth.uid()) + تحقق أطوال + سقف أجهزة لكل مستخدم.
--   3) إعدادات التوزيع `push_settings` server-only بلا أي grants — تُغذَّى من
--      السيرفر (Next) عبر RPC `upsert_push_setting` بحارس is_admin() من متغيرات
--      بيئة السيرفر (لا أسرار في الريبو إطلاقاً). إن كانت فارغة → لا إرسال
--      (graceful no-op — لا يكسر بقية النظام).
--   4) سر الدالة `x-push-secret` يُتحقق داخل الـ Edge Function (verify_jwt=false
--      لأن pg_net يدعم النشر بدون JWT) — لا تسريبات أبداً للعميل.
-- Idempotent — قابلة لإعادة التطبيق.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------------
-- PART 1 — إعدادات التوزيع (server-only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_settings (
  key   text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);

ALTER TABLE public.push_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_settings FROM anon, authenticated, PUBLIC;

INSERT INTO public.push_settings (key, value) VALUES
  ('push_function_url', ''),
  ('push_apikey', ''),
  ('push_secret', '')
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- PART 2 — أجهزة المستخدم (push tokens)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token        text        NOT NULL UNIQUE,
  platform     text        NOT NULL DEFAULT 'web' CHECK (platform = 'web'),
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_push_tokens_token_len_check
    CHECK (char_length(token) BETWEEN 10 AND 4096)
);

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS user_push_tokens_user_idx
  ON public.user_push_tokens (user_id);

-- RLS: صاحبها فقط يقرأ أو يحذف — لا إدراج/تعديل من العميل (التسجيل RPC فقط)
DROP POLICY IF EXISTS "push tokens read own" ON public.user_push_tokens;
CREATE POLICY "push tokens read own"
  ON public.user_push_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "push tokens delete own" ON public.user_push_tokens;
CREATE POLICY "push tokens delete own"
  ON public.user_push_tokens FOR DELETE TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON public.user_push_tokens FROM anon, authenticated;
GRANT SELECT, DELETE ON public.user_push_tokens TO authenticated;

-- ----------------------------------------------------------------------------
-- PART 3 — RPCs التسجيل/الإلغاء (SECURITY DEFINER — ثبّت الملكية سيرفراً)
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
END;
$function$;

CREATE OR REPLACE FUNCTION public.unregister_push_token(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_token IS NULL OR char_length(p_token) NOT BETWEEN 10 AND 4096 THEN RETURN; END IF;
  DELETE FROM public.user_push_tokens
  WHERE token = p_token AND user_id = auth.uid();
END;
$function$;

REVOKE ALL ON FUNCTION public.register_push_token(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_push_token(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_push_token(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.unregister_push_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unregister_push_token(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.unregister_push_token(text) TO authenticated;

-- ----------------------------------------------------------------------------
-- PART 4 — upsert_push_setting (admin فقط — من السيرفر، بلا أسرار للعميل)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_push_setting(p_key text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN RETURN; END IF;
  IF p_key IS NULL OR char_length(p_key) > 64 THEN RETURN; END IF;
  IF p_value IS NULL OR char_length(p_value) > 2000 THEN RETURN; END IF;
  IF p_key NOT IN ('push_function_url', 'push_apikey', 'push_secret') THEN RETURN; END IF;

  INSERT INTO public.push_settings (key, value) VALUES (p_key, p_value)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
END;
$function$;

REVOKE ALL ON FUNCTION public.upsert_push_setting(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_push_setting(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_push_setting(text, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- PART 5 — trigger التوزيع: كل إدراج notification → استدعاء Edge Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dispatch_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_url text;
  v_apikey text;
  v_secret text;
BEGIN
  SELECT value INTO v_url    FROM public.push_settings WHERE key = 'push_function_url';
  SELECT value INTO v_apikey FROM public.push_settings WHERE key = 'push_apikey';
  SELECT value INTO v_secret FROM public.push_settings WHERE key = 'push_secret';

  -- غير مهيّأة البنية بعد — بلا إرسال (graceful no-op)
  IF btrim(coalesce(v_url, '')) = '' OR btrim(coalesce(v_secret, '')) = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url => v_url,
    body => jsonb_build_object('notification_id', NEW.id::text),
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', coalesce(v_apikey, ''),
      'x-push-secret', v_secret
    ),
    timeout_milliseconds => 5000
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_push_dispatch ON public.notifications;
CREATE TRIGGER trg_notify_push_dispatch
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_notification();

REVOKE ALL ON FUNCTION public.dispatch_push_notification() FROM PUBLIC, anon, authenticated;

COMMIT;