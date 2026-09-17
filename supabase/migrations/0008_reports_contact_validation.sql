-- ============================================================================
-- 0008_reports_contact_validation.sql — المرحلة 5: تحقق سيرفري لـ reports
--                                    + contact_messages
-- ----------------------------------------------------------------------------
-- يغلّف الجدولين (كانا غائبين عن السلسلة) في السلسلة النقية + يُحكِّم التحقق:
--   1) CHECK أطوال/أنماط مطابقة لتحقق الواجهة (validateName 2–60،
--      validatePhone أرقام 10–15، validateMessage 5–1500).
--   2) تشفير سياسات الإدراج: anon ⇒ reporter_user_id IS NULL؛ authenticated
--      ⇒ reporter_user_id = auth.uid()؛ وكلاهما status='pending' (reports)
--      و is_read=false (contact_messages) — بدل WITH CHECK true.
--   3) توحيد سياسات المشرف القديمة (read/update/delete) إلى سياسة
--      `admin all` واحدة FOR ALL عبر is_admin() (نمط 0003/0004/0007).
--   4) guard_report_update (موجودة live بلا REVOKE) تُضمَّن رسمياً +
--      REVOKE EXECUTE من PUBLIC/anon/authenticated.
--   5) فهرس status لقراءات لوحة المشرف.
--   6) تنظيف grants: anon = INSERT فقط (كان يملك كل شيء على reports).
-- Idempotent: CREATE/ALTER/DO مع IF NOT EXISTS + DROP POLICY IF EXISTS.
-- ============================================================================

BEGIN;

-- 1) الجداول في السلسلة (مطابقة الـ live؛ التطبيق يتخطاها إن وُجدت)
CREATE TABLE IF NOT EXISTS public.reports (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  craftsman_name   text        NOT NULL,
  phone            text,
  message          text        NOT NULL,
  status           text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reporter_user_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  phone      text        NOT NULL,
  message    text        NOT NULL,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) قيود المحتوى (تُضاف حتى لو وُجدت الجداول حياً) — idempotent عبر DO
DO $body$
BEGIN
  -- reports
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_craftsman_name_len_check' AND conrelid = 'public.reports'::regclass) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_craftsman_name_len_check
      CHECK (length(btrim(craftsman_name)) BETWEEN 2 AND 60);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_message_len_check' AND conrelid = 'public.reports'::regclass) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_message_len_check
      CHECK (length(btrim(message)) BETWEEN 5 AND 1500);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_phone_digits_check' AND conrelid = 'public.reports'::regclass) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_phone_digits_check
      CHECK (phone IS NULL
             OR length(regexp_replace(phone, '[^0-9]', '', 'g')) BETWEEN 10 AND 15);
  END IF;

  -- contact_messages
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_name_len_check' AND conrelid = 'public.contact_messages'::regclass) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_name_len_check
      CHECK (length(btrim(name)) BETWEEN 2 AND 60);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_phone_digits_check' AND conrelid = 'public.contact_messages'::regclass) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_phone_digits_check
      CHECK (length(regexp_replace(phone, '[^0-9]', '', 'g')) BETWEEN 10 AND 15);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_message_len_check' AND conrelid = 'public.contact_messages'::regclass) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_message_len_check
      CHECK (length(btrim(message)) BETWEEN 5 AND 1500);
  END IF;
END $body$;

-- 3) سياسات الإدراج المشفّرة (بدل WITH CHECK true)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports anyone can submit" ON public.reports;
DROP POLICY IF EXISTS "reports anon submit" ON public.reports;
DROP POLICY IF EXISTS "reports user submit" ON public.reports;

CREATE POLICY "reports anon submit"
  ON public.reports FOR INSERT
  TO anon
  WITH CHECK (reporter_user_id IS NULL AND status = 'pending');

CREATE POLICY "reports user submit"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_user_id = auth.uid() AND reporter_user_id IS NOT NULL AND status = 'pending');

DROP POLICY IF EXISTS "contact_messages anyone can submit" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages anon submit" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages user submit" ON public.contact_messages;

CREATE POLICY "contact_messages anon submit"
  ON public.contact_messages FOR INSERT
  TO anon
  WITH CHECK (is_read = false);

CREATE POLICY "contact_messages user submit"
  ON public.contact_messages FOR INSERT
  TO authenticated
  WITH CHECK (is_read = false);

-- 4) توحيد سياسات المشرف إلى admin all (FOR ALL عبر is_admin)
DROP POLICY IF EXISTS "reports admin read" ON public.reports;
DROP POLICY IF EXISTS "reports admin update" ON public.reports;
DROP POLICY IF EXISTS "reports admin delete" ON public.reports;
DROP POLICY IF EXISTS "reports admin all" ON public.reports;

CREATE POLICY "reports admin all"
  ON public.reports FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "contact_messages admin read" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages admin update" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages admin delete" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages admin all" ON public.contact_messages;

CREATE POLICY "contact_messages admin all"
  ON public.contact_messages FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 5) حارس دورة البلاغ رسمياً في السلسلة + REVOKE EXECUTE
CREATE OR REPLACE FUNCTION public.guard_report_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'pending' AND NEW.status IN ('reviewed', 'dismissed') THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'انتقال حالة غير صالح للبلاغ — الحالات النهائية لا تُعاد فتحها';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.guard_report_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_report_update() FROM anon;
REVOKE EXECUTE ON FUNCTION public.guard_report_update() FROM authenticated;

DROP TRIGGER IF EXISTS trg_report_update_guard ON public.reports;
CREATE TRIGGER trg_report_update_guard
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.guard_report_update();

-- 6) فهرس حالة البلاغات لقوائم لوحة المشرف
CREATE INDEX IF NOT EXISTS reports_status_created_idx
  ON public.reports (status, created_at DESC);

-- 7) تنظيف grants: anon على reports = INSERT فقط (كان يملك كل شيء)
REVOKE ALL ON public.reports FROM anon;
GRANT INSERT ON public.reports TO anon;

REVOKE ALL ON public.contact_messages FROM anon;
GRANT INSERT ON public.contact_messages TO anon;

COMMIT;