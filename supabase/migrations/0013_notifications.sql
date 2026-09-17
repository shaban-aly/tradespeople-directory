-- ============================================================================
-- 0013_notifications.sql — المرحلة 9: نظام الإشعارات (In-App)
-- ----------------------------------------------------------------------------
-- القرارات المعتمدة (المرحلة 9 في docs/DATABASE-RULES.md):
--   1) سجل `notifications` في القاعدة = مصدر الحقيقة الوحيد لأي حدث، وطبقة
--      Delivery منفصلة (قنوات) تُبنى لاحقاً فوقه: In-App DB (مركز + عدّاد +
--      mark-read) مُنفَّذة هنا، ثم Toast داخل التطبيق عبر Realtime، ثم
--      Firebase Push خارج/داخل التطبيق (مستقبلاً — مفاتيح FCM من المستخدم لاحقاً).
--   2) الإنشاء Triggers فقط (قرار المستخدم): أياً كان الكاتب (الواجهة من المتصفح
--      أو edits مباشرة) يلتقطه trigger — لا يعتمد أي كود تطبيق على الإنشاء.
--      دالة `create_notification` SECURITY DEFINER بلا EXECUTE عام تستدعيها
--      الـ triggers (نفس نمط حرّاس guard_* في 0001/0003-0008).
--   3) RLS: القراءة للمالك فقط `recipient_id = auth.uid()` — لا INSERT/UPDATE/DELETE
--      من العميل إطلاقاً؛ الـ mark-read عبر RPC `mark_notifications_read` بتحقق
--      الملكية + شرط `read_at IS NULL` يضمن عدم انعكاسه (one-way).
--   4) المضاعفة تُمنع بقيد فريد `key` + `ON CONFLICT (key) DO NOTHING`.
--      مفاتيح ثابتة للأحداث التي تحدث مرة واحدة في الدورة (join: <id>,
--      new_request/new_report/new_message لكل مستلم) ومفاتيح لحالة الهدف
--      للأحداث القابلة للتكرار (verified:/publish: بمعامل true/false — إعادة
--      نفس الحالة لا تُنشئ إشعاراً مكرراً).
--   5) إشعارات المشرفين (طلب جديد/بلاغ جديد/رسالة جديدة) تُنشأ لكل مستخدم بدور
--      admin (قرار المستخدم)، مع استثناء المشرف الفاعل من القائمة (لا تُنشأ لنفسه).
--   6) عند الموافقة على طلب انضمام لا يُنشأ إشعارا account_linked إضافي للطالب
--      (يكفي join_approved — الربط داخل القبول) — إشعار account_linked مخصص
--      لربط حساب لاحق بمجهود افصل (link_craftsman_user).
-- Idempotent (CREATE ... IF NOT EXISTS / DROP ... IF EXISTS) — قابلة لإعادة
-- التطبيق، بلا افتراض على حالة الـ live: كل الدوال تُنشأ في نطاق السلسلة فقط.
-- ============================================================================

BEGIN;

-- ==================== PART 1 — الجدول ======================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text        NOT NULL,
  title        text        NOT NULL,
  body         text        NOT NULL,
  metadata     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  read_at      timestamptz DEFAULT NULL,
  key          text        NOT NULL UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_type_check CHECK (
    type IN (
      'join_approved', 'join_rejected', 'verified', 'published',
      'account_linked', 'review_added', 'report_status',
      'new_request', 'new_report', 'new_message'
    )
  ),
  CONSTRAINT notifications_text_len_check CHECK (
    char_length(title) <= 200 AND char_length(body) <= 1000
  )
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- قائمة المستلم (ترتيب زمني تنازلي — أول ما يُحَمَّل الأحدث)
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications (recipient_id, created_at DESC);

-- RLS: المالك الوحيد الذي يقرأ صفوفه — لا إدراج/تعديل/حذف من العميل إطلاقاً
DROP POLICY IF EXISTS "notifications recipient read own" ON public.notifications;
CREATE POLICY "notifications recipient read own"
  ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

-- منح صريحة: SELECT فقط لـ authenticated (القراءة عبر RLS) — لا anon ولا تغيير
REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;

-- ==================== PART 2 — دالة الإنشاء (SECURITY DEFINER، داخلية) =====

-- كاتب وحيد لصفوف notifications؛ تستدعيها الـ triggers فقط.
-- SECURITY DEFINER بلا EXECUTE عام (REVOKE) — لا استدعاء مباشر من العميل.
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_id uuid,
  p_type         text,
  p_title        text,
  p_body         text,
  p_metadata     jsonb DEFAULT '{}'::jsonb,
  p_key          text  DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_recipient_id IS NULL
     OR p_type IS NULL OR p_title IS NULL OR p_body IS NULL THEN
    RETURN;
  END IF;

  -- وقاية: العمود key NOT NULL UNIQUE — مفتاح مشتق عند غيابه (لا فشل في trigger)
  IF p_key IS NULL THEN
    p_key := p_type || ':' || gen_random_uuid()::text;
  END IF;

  -- كبت أطوال دفاعي (مطابق لـ CHECK الجدول) — لا مدخلات ضخمة عبر trigger
  INSERT INTO public.notifications
    (recipient_id, type, title, body, metadata, key)
  VALUES (
    p_recipient_id,
    p_type,
    left(p_title, 200),
    left(p_body, 1000),
    p_metadata,
    p_key
  )
  ON CONFLICT (key) DO NOTHING;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, jsonb, text) FROM anon, authenticated;

-- ==================== PART 3 — قائمة أدوار المشرفين (داخلية) ===============

-- تستخدمها دوال إشعارات المشرفين فقط — بلا EXECUTE عام (REVOKE).
CREATE OR REPLACE FUNCTION public.get_admin_user_ids()
RETURNS TABLE (user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT p.id FROM public.profiles p WHERE p.role = 'admin';
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_user_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_user_ids() FROM anon, authenticated;

-- حلقة الإشعار لكل مشرف (مع استثناء المشرف الفاعل من القائمة)
CREATE OR REPLACE FUNCTION public.notify_all_admins(
  p_type     text,
  p_title    text,
  p_body     text,
  p_metadata jsonb,
  p_key      text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin uuid;
BEGIN
  FOR v_admin IN SELECT user_id FROM public.get_admin_user_ids() LOOP
    IF v_admin IS DISTINCT FROM auth.uid() THEN
      PERFORM public.create_notification(
        v_admin, p_type, p_title, p_body, p_metadata,
        p_key || ':' || v_admin::text
      );
    END IF;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_all_admins(text, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_all_admins(text, text, text, jsonb, text) FROM anon, authenticated;

-- ==================== PART 4 — الـ triggers (مصادر الأحداث) ================

-- (أ) قبول/رفض طلب انضمام → إشعار بصاحب الطلب (submitted_by)
DROP TRIGGER IF EXISTS trg_notify_join_status ON public.craftsmen;
CREATE OR REPLACE FUNCTION public.notify_join_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    IF NEW.submitted_by IS NOT NULL THEN
      IF NEW.status = 'approved' THEN
        PERFORM public.create_notification(
          NEW.submitted_by,
          'join_approved',
          'تم قبول تسجيلك 🎉',
          'مبروك! «' || COALESCE(NEW.name, 'صنايعي') ||
            '» اتنشر في الدليل وحسابك اتربط ببروفايلك كصنايعي.',
          jsonb_build_object('craftsman_id', NEW.id, 'slug', NEW.slug, 'name', NEW.name),
          'join:' || NEW.id::text
        );
      ELSE
        PERFORM public.create_notification(
          NEW.submitted_by,
          'join_rejected',
          'تم رفض تسجيلك',
          'إحنا آسفين، طلب تسجيل «' || COALESCE(NEW.name, 'الصنايعي') ||
            '» اترفض — ممكن تتواصل معانا للمراجعة.',
          jsonb_build_object('craftsman_id', NEW.id, 'name', NEW.name),
          'join:' || NEW.id::text
        );
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_join_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_join_status() FROM anon, authenticated;

CREATE TRIGGER trg_notify_join_status
  AFTER UPDATE OF status ON public.craftsmen
  FOR EACH ROW EXECUTE FUNCTION public.notify_join_status();

-- (ب) توثيق/إلغاء توثيق، ونشر/إخفاء → إشعار بصاحب الملف (بروفايل مربوط)
--    يتم التحقق من OLD.status = 'approved' لحالة النشر بحيث لا يصدر إشعاران
--    من عملية الموافقة نفسها (التي تغيّر status و is_published معاً).
CREATE OR REPLACE FUNCTION public.notify_craftsman_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
BEGIN
  IF OLD.verified IS DISTINCT FROM NEW.verified
     AND NEW.is_published = OLD.is_published THEN
    SELECT id INTO v_owner FROM public.profiles WHERE craftsman_id = NEW.id LIMIT 1;
    IF v_owner IS NOT NULL THEN
      PERFORM public.create_notification(
        v_owner,
        'verified',
        CASE WHEN NEW.verified THEN 'بروفايلك اتحقق ✅' ELSE 'إلغاء التوثيق' END,
        CASE WHEN NEW.verified
             THEN '«' || NEW.name || '» بقى موثّق في الدليل — يظهر بشارة موثّق.'
             ELSE 'إلغيت شارة التوثيق من بروفايل «' || NEW.name || '».' END,
        jsonb_build_object('craftsman_id', NEW.id, 'name', NEW.name, 'verified', NEW.verified),
        'verified:' || NEW.id::text || ':' || NEW.verified::text
      );
    END IF;
  END IF;

  IF NEW.is_published IS DISTINCT FROM OLD.is_published
     AND OLD.status = 'approved' THEN
    SELECT id INTO v_owner FROM public.profiles WHERE craftsman_id = NEW.id LIMIT 1;
    IF v_owner IS NOT NULL THEN
      PERFORM public.create_notification(
        v_owner,
        'published',
        CASE WHEN NEW.is_published THEN 'بروفايلك اتنشر ✅' ELSE 'بروفايلك اتعمل عليه إخفاء' END,
        CASE WHEN NEW.is_published
             THEN '«' || NEW.name || '» دلوقتي ظاهر للزوار في الدليل.'
             ELSE '«' || NEW.name || '» متخفّي عن الدليل — تواصل مع المشرف.' END,
        jsonb_build_object('craftsman_id', NEW.id, 'name', NEW.name, 'published', NEW.is_published),
        'publish:' || NEW.id::text || ':' || NEW.is_published::text
      );
    END IF;
  END IF;

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_craftsman_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_craftsman_state() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_craftsman_state ON public.craftsmen;
CREATE TRIGGER trg_notify_craftsman_state
  AFTER UPDATE OF verified, is_published ON public.craftsmen
  FOR EACH ROW EXECUTE FUNCTION public.notify_craftsman_state();

-- (ج) ربط حساب بملف صنايعي (link_craftsman_user) → إشعار للمستخدم المربوط
--    لا يُنشأ عندما يكون الربط ضمن القبول (submitted_by = المستخدم) —
--    يكفي join_approved حينها (القرار 6 أعلاه).
CREATE OR REPLACE FUNCTION public.notify_account_linked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.craftsman_id IS NOT NULL
     AND NEW.craftsman_id IS DISTINCT FROM OLD.craftsman_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.craftsmen c
      WHERE c.id = NEW.craftsman_id AND c.submitted_by = NEW.id
    ) THEN
      PERFORM public.create_notification(
        NEW.id,
        'account_linked',
        'اتربط حسابك بملف صنايعي 🔗',
        'حسابك اتربط ببروفايل صنايعي في الدليل — تقدر تدخل لوحة الفني من ملفك.',
        jsonb_build_object('craftsman_id', NEW.craftsman_id),
        'link:' || NEW.id::text || ':' || NEW.craftsman_id::text
      );
    END IF;
  END IF;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_account_linked() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_account_linked() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_account_linked ON public.profiles;
CREATE TRIGGER trg_notify_account_linked
  AFTER UPDATE OF craftsman_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_account_linked();

-- (د) تقييم جديد → إشعار لصاحب الملف (بلا إشعار لتقييم المالك على نفسه)
CREATE OR REPLACE FUNCTION public.notify_review_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
BEGIN
  SELECT id INTO v_owner FROM public.profiles WHERE craftsman_id = NEW.craftsman_id LIMIT 1;
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM NEW.user_id THEN
    PERFORM public.create_notification(
      v_owner,
      'review_added',
      'واحد قيّم شغلك ⭐',
      COALESCE(NEW.user_name, 'عميل') || ' قيّم بروفايلك ' ||
        NEW.rating::text || ' من 5 نجوم.',
      jsonb_build_object('craftsman_id', NEW.craftsman_id, 'review_id', NEW.id, 'rating', NEW.rating),
      'review:' || NEW.id::text
    );
  END IF;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_review_added() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_review_added() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_review_added ON public.reviews;
CREATE TRIGGER trg_notify_review_added
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_review_added();

-- (هـ) تغيير حالة بلاغ → إشعار للمبلّغ المسجّل فقط (reporter_user_id)
CREATE OR REPLACE FUNCTION public.notify_report_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.reporter_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.reporter_user_id,
      'report_status',
      'تحديث على بلاغك',
      CASE NEW.status
        WHEN 'reviewed' THEN 'بلاغك اتراجع وتمت مراجعته.'
        WHEN 'dismissed' THEN 'بلاغك اتقفل بعد المراجعة.'
        ELSE 'تحديث على بلاغك.'
      END,
      jsonb_build_object('report_id', NEW.id, 'status', NEW.status),
      'report:' || NEW.id::text || ':' || NEW.status::text
    );
  END IF;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_report_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_report_status() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_report_status ON public.reports;
CREATE TRIGGER trg_notify_report_status
  AFTER UPDATE OF status ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_report_status();

-- (و) طلب انضمام جديد → لكل مشرف (قرار المستخدم)
CREATE OR REPLACE FUNCTION public.notify_admins_new_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM public.notify_all_admins(
      'new_request',
      'طلب تسجيل جديد 📥',
      '«' || COALESCE(NEW.name, 'صنايعي') || '» قدّم طلب انضمام للدليل.',
      jsonb_build_object('craftsman_id', NEW.id, 'name', NEW.name),
      'newreq:' || NEW.id::text
    );
  END IF;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_admins_new_request() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admins_new_request() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_admins_new_request ON public.craftsmen;
CREATE TRIGGER trg_notify_admins_new_request
  AFTER INSERT ON public.craftsmen
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_request();

-- (ز) بلاغ جديد → لكل مشرف
CREATE OR REPLACE FUNCTION public.notify_admins_new_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.notify_all_admins(
    'new_report',
    'بلاغ جديد 🚩',
    'بلاغ بخصوص «' || COALESCE(NEW.craftsman_name, 'صنايعي') || '».',
    jsonb_build_object('report_id', NEW.id, 'craftsman_name', NEW.craftsman_name),
    'newrep:' || NEW.id::text
  );
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_admins_new_report() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admins_new_report() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_admins_new_report ON public.reports;
CREATE TRIGGER trg_notify_admins_new_report
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_report();

-- (ح) رسالة تواصل جديدة → لكل مشرف
CREATE OR REPLACE FUNCTION public.notify_admins_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.notify_all_admins(
    'new_message',
    'رسالة تواصل جديدة 📩',
    COALESCE(NEW.name, 'زائر') || ' بعت رسالة عبر نموذج التواصل.',
    jsonb_build_object('message_id', NEW.id, 'sender', NEW.name),
    'newmsg:' || NEW.id::text
  );
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_admins_new_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admins_new_message() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_admins_new_message ON public.contact_messages;
CREATE TRIGGER trg_notify_admins_new_message
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_message();

-- ==================== PART 5 — RPC mark-read (القراءة فقط) =================

-- يحدّث read_at للمالك فقط وبشرط UNREAD (read_at IS NULL) — لا انعكاس أبداً.
-- EXECUTE لـ authenticated فقط (بلا anon/PUBLIC).
CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
  v_user uuid;
BEGIN
  IF p_ids IS NULL OR cardinality(p_ids) = 0 THEN
    RETURN 0;
  END IF;

  -- اقتصار حجم المدخلات دفاعياً
  IF cardinality(p_ids) > 200 THEN
    p_ids := p_ids[1:200];
  END IF;

  v_user := auth.uid();
  IF v_user IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.notifications
  SET read_at = now()
  WHERE id = ANY(p_ids)
    AND recipient_id = v_user
    AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.mark_notifications_read(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_notifications_read(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid[]) TO authenticated;

-- ==================== PART 6 — Realtime (قناة Toast داخل التطبيق) ==========

-- إضافة الجدول لنشر supabase_realtime إن كان موجوداً (منصة Supabase) — الاشتراك
-- يخضع لـ RLS (العميل يقرأ صفوفه فقط عبر جلسته) لحين تحضير قناة الـ Toast داخل
-- التطبيق وFirebase Push للخارج — idempotent.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

COMMIT;