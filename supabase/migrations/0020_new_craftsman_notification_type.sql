-- ============================================================================
-- 0020_new_craftsman_notification_type.sql
-- فصل إشعار "صنايعي جديد منشور" (new_craftsman) عن "طلب انضمام" (new_request)
-- ----------------------------------------------------------------------------
-- التغييرات:
--   1) إضافة 'new_craftsman' للـ CHECK constraint
--   2) ترحيل السجلات القديمة (key LIKE 'cat_interest:%') من new_request إلى new_craftsman
--   3) تحديث notify_category_subscribers_on_publish لاستخدام 'new_craftsman'
--      مع الحفاظ على كامل المنطق الأصلي (anonymous_push_outbox + pg_net)
-- ============================================================================

BEGIN;

-- ========== 1) تحديث CHECK constraint ======================================

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'join_approved', 'join_rejected', 'verified', 'published',
    'account_linked', 'review_added', 'report_status',
    'new_request', 'new_report', 'new_message', 'new_craftsman'
  )
);

-- ========== 2) ترحيل السجلات القديمة =======================================
-- key LIKE 'cat_interest:%' حصري لإشعار المتابعين عند نشر صنايعي جديد

UPDATE public.notifications
SET type = 'new_craftsman'
WHERE type = 'new_request' AND key LIKE 'cat_interest:%';

-- ========== 3) تحديث الدالة — تغيير type فقط + إضافة link للـ metadata =====
-- المنطق الأصلي محفوظ بالكامل من 0017_anonymous_push.sql

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
        'new_craftsman',                                          -- ← التغيير الوحيد
        'صنايعي جديد في ' || coalesce(v_cat_name, 'التصنيف') || ' 🛠️',
        '«' || coalesce(NEW.name, 'صنايعي') || '» انضم للدليل حديثاً — تفقد بروفايله وتواصل معه.',
        jsonb_build_object(
          'craftsman_id', NEW.id,
          'slug', NEW.slug,
          'category_slug', v_cat_slug,
          'name', NEW.name,
          'link', '/craftsman/' || coalesce(NEW.slug, '')         -- ← إضافة رابط مباشر
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

COMMIT;
