-- ============================================================================
-- push_token_device_cap — إصلاح سقف الأجهزة العشرة في register_push_token
-- ----------------------------------------------------------------------------
-- السبب (الخلل الذي أدخلته 0018):
--   الدالة كانت تحسب عدد أجهزة المستخدم وتحذف الأقدم *قبل* أن تعرف إن كان
--   التوكن المطلوب مسجّلاً بالفعل لهذا الحساب. النتيجة: كل تحميل صفحة من جهاز
--   مسجّل كان يحذف جهازاً حقيقياً آخر ظناً أنه تجاوز السقف — فالمستخدم ذو
--   الأجهزة العشرة يفقد أجهزته واحداً تلو الآخر بلا سبب، ويبدأ في استقبال
--   الإشعارات على جهاز واحد فقط.
--
-- القرار:
--   1) البحث عن التوكن أولاً ومعرفة مالكه الحالي.
--   2) توكن موجود + نفس الحساب => تحديث last_seen_at وبيانات الجهاز فقط،
--      بلا أي حذف إطلاقاً (حتى لو كان المستخدم عند حد الأجهزة العشرة).
--   3) توكن جديد أو توكن سينتقل إلى حساب آخر:
--        أ) ننقل التوكن أولاً (ON CONFLICT DO UPDATE يغيّر user_id)، فإذا كان
--           مملوكاً لحساب آخر غادر ذلك الحساب العدد، فلا نطبّق السقف عليه.
--        ب) نطبّق السقف على أجهزة هذا المستخدم بعد النقل، ونحذف الأقدم فقط
--           إذا تجاوزنا الحد فعلياً — مع استثناء التوكن نفسه من الحذف.
--   4) سلوك نقل التوكن عند تسجيل الدخول بحساب جديد من نفس المتصفح محفوظ
--      عمداً (قرار التصميم في 0018) — لكن بلا حذف جهاز زائد من الحساب القديم.
--   5) الحد الأقصى للحذف = (العدد بعد النقل - الحد) أي الصف الزائد فقط في
--      الاستدعاء الواحد، فلا يمكن للحشو أن يمسح دفعة واحدة.
--   6) الفهرس (user_id, created_at) يخدم ترتيب الأقدم أولاً بلا فرز.
--
-- Idempotent — قابلة لإعادة التطبيق.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1 — register_push_token (نفس توقيع الوسيط الخمسة كما في 0018)
-- ============================================================================
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
  v_user           uuid := auth.uid();
  v_owner          uuid;
  v_count          integer;
  v_anon_interests text[];
  v_clean_type     text;
  v_clean_name     text;
  v_clean_ua       text;
  c_max_devices    constant integer := 10;
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

  -- 1) مالك التوكن حالياً (قبل أي كتابة)
  SELECT user_id INTO v_owner
  FROM public.user_push_tokens
  WHERE token = p_token;

  -- 2) المسار الآمن: التوكن لهذا الحساب أصلاً => تحديث last_seen_at وبيانات
  --    الجهاز فقط، بلا حذف أي جهاز مهما بلغ عدد الأجهزة (الإصلاح الأساسي).
  IF v_owner IS NOT NULL AND v_owner = v_user THEN
    UPDATE public.user_push_tokens
    SET platform     = p_platform,
        device_type  = v_clean_type,
        device_name  = v_clean_name,
        user_agent   = v_clean_ua,
        last_seen_at = now()
    WHERE token = p_token;
  ELSE
    -- 3) توكن جديد أو توكن ينتقل إلى حساب آخر: ننقله أولاً. لو كان مملوكاً
    --    لحساب آخر فذلك الحساب فقد جهازاً — لا نطبّق سقفه على جهاز خسره.
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
      user_id      = EXCLUDED.user_id,
      platform     = EXCLUDED.platform,
      device_type  = EXCLUDED.device_type,
      device_name  = EXCLUDED.device_name,
      user_agent   = EXCLUDED.user_agent,
      last_seen_at = now();

    -- 4) السقف يُطبَّق على ما بعد النقل فقط، والحذف للأقدم أولاً عند التجاوز.
    --    استثناء التوكن نفسه من مرشحي الحذف: التوكن المنقول يحتفظ بـ created_at
    --    قديم، فلولا هذا الاستثناء حذفه السقف فوراً عند وصوله لحساب ممتلئ — أي أن
    --    تسجيل الجهاز الجديد يُلغى في نفس الاستدعاء ولا تصله رسالة أبداً.
    SELECT count(*) INTO v_count FROM public.user_push_tokens WHERE user_id = v_user;
    IF v_count > c_max_devices THEN
      DELETE FROM public.user_push_tokens
      WHERE user_id = v_user
        AND token <> p_token
        AND id IN (
          SELECT id FROM public.user_push_tokens
          WHERE user_id = v_user
            AND token <> p_token
          ORDER BY created_at ASC, id ASC
          LIMIT (v_count - c_max_devices)
        );
    END IF;
  END IF;

  -- 5) التبني (Adoption): نقل اهتمامات الزائر المجهول لحسابه المسجل وإلغاء السجل المجهول
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

-- ============================================================================
-- PART 2 — فهرس يخدم ترتيب الأقدم أولاً وسقف الأجهزة
-- ============================================================================
CREATE INDEX IF NOT EXISTS user_push_tokens_user_created_idx
  ON public.user_push_tokens (user_id, created_at ASC);

COMMIT;
