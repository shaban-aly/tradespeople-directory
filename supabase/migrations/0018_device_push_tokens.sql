-- ============================================================================
-- 0018_device_push_tokens.sql — دعم تعدد الأجهزة وتمييز نوع وهوية كل جهاز
-- ----------------------------------------------------------------------------
-- الأهداف:
--   1) إضافة بيانات تعريف الجهاز (device_type, device_name, user_agent)
--      إلى جدول user_push_tokens.
--   2) تحديث دالة register_push_token لدعم الوسائط الجديدة، وإصلاح سلوك
--      ON CONFLICT (token) لتحديث user_id و device_info تلقائياً عند تسجيل
--      الدخول بحساب جديد من نفس المتصفح.
--   3) استمرار التوافق الكامل مع التبني التلقائي للزائر المجهول (Adoption).
--
-- Idempotent — قابلة لإعادة التطبيق.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PART 1 — إضافة أعمدة تعريف الجهاز لجدول user_push_tokens
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_push_tokens
  ADD COLUMN IF NOT EXISTS device_type text NOT NULL DEFAULT 'desktop',
  ADD COLUMN IF NOT EXISTS device_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS user_agent  text NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_push_tokens_device_type_check'
  ) THEN
    ALTER TABLE public.user_push_tokens
      ADD CONSTRAINT user_push_tokens_device_type_check
      CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown'));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PART 2 — تحديث دالة register_push_token (استبدال التوقيع القديم لمنع اللبس)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.register_push_token(text, text);

CREATE OR REPLACE FUNCTION public.register_push_token(
  p_token       text,
  p_platform    text DEFAULT 'web',
  p_device_type text DEFAULT 'desktop',
  p_device_name text DEFAULT '',
  p_user_agent  text DEFAULT ''
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
  v_clean_type text;
  v_clean_name text;
  v_clean_ua text;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  IF p_token IS NULL OR char_length(p_token) NOT BETWEEN 10 AND 4096 THEN RETURN; END IF;
  IF p_platform IS DISTINCT FROM 'web' THEN RETURN; END IF;

  v_clean_type := CASE
    WHEN p_device_type IN ('mobile', 'tablet', 'desktop', 'unknown') THEN p_device_type
    ELSE 'unknown'
  END;

  v_clean_name := COALESCE(substring(trim(p_device_name) from 1 for 100), '');
  v_clean_ua   := COALESCE(substring(trim(p_user_agent) from 1 for 512), '');

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

  INSERT INTO public.user_push_tokens (
    user_id,
    token,
    platform,
    device_type,
    device_name,
    user_agent,
    last_seen_at
  )
  VALUES (
    v_user,
    p_token,
    p_platform,
    v_clean_type,
    v_clean_name,
    v_clean_ua,
    now()
  )
  ON CONFLICT (token) DO UPDATE SET
    user_id     = EXCLUDED.user_id,
    platform    = EXCLUDED.platform,
    device_type = EXCLUDED.device_type,
    device_name = EXCLUDED.device_name,
    user_agent  = EXCLUDED.user_agent,
    last_seen_at = now();

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

REVOKE ALL ON FUNCTION public.register_push_token(text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_push_token(text, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_push_token(text, text, text, text, text) TO authenticated;

COMMIT;
