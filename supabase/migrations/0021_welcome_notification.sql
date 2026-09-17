-- ============================================================================
-- 0021_welcome_notification.sql — إشعار ترحيب المستخدمين الجدد (welcome)
-- ----------------------------------------------------------------------------
-- التغييرات:
--   1) إضافة 'welcome' للـ CHECK constraint (notifications_type_check)
--   2) تحديث handle_new_user(): الحفاظ على كامل المنطق الأصلي من
--      0004_profiles.sql + إنشاء إشعار ترحيب (welcome) للمستخدم الجديد
--      بعد إنشاء الـ profile بنجاح.
-- منع التكرار: المفتاح الثابت 'welcome:<user_id>' + ON CONFLICT (key)
--              DO NOTHING داخل create_notification — إشعار واحد فقط لكل مستخدم.
-- Idempotent (DROP/ADD constraint + CREATE OR REPLACE) — قابلة لإعادة التطبيق
-- بلا افتراض على حالة الـ live.
-- ============================================================================

BEGIN;

-- ========== 1) تحديث CHECK constraint — إضافة 'welcome' =====================

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'join_approved', 'join_rejected', 'verified', 'published',
    'account_linked', 'review_added', 'report_status',
    'new_request', 'new_report', 'new_message', 'new_craftsman',
    'welcome'
  )
);

-- ========== 2) تحديث handle_new_user — إضافة إشعار الترحيب ==================
-- المنطق الأصلي محفوظ بالكامل (role='client' ثابت + ON CONFLICT (id) DO NOTHING) —
-- أُضيف فقط استدعاء create_notification بعد إنشاء الـ profile بنجاح،
-- بمفتاح ثابت 'welcome:<user_id>' (منع التكرار عبر ON CONFLICT (key) DO NOTHING).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_display_name text;
BEGIN
  v_display_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, role, display_name, avatar_url)
  VALUES (
    NEW.id,
    'client',
    v_display_name,
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  PERFORM public.create_notification(
    NEW.id,
    'welcome',
    'أهلاً بيك في دليل السويس 👋',
    'نورت دليل السويس! اكتشف الصنايعية والخدمات من حولك وتواصل مع المناسب ليك.',
    '{}'::jsonb,
    'welcome:' || NEW.id::text
  );

  RETURN NEW;
END;
$function$;

COMMIT;