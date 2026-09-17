-- ============================================================================
-- 0001_initial_schema.sql — Baseline نقي بعد قرار التنظيف الشامل
-- ----------------------------------------------------------------------------
-- يلغي نهائياً: join_requests + social_links (جدول منفصل) + دوالها
-- ويحوّل craftsmen إلى الجدول الوحيد لدورة حياة الصانع:
--   status (pending|approved|rejected) + submitted_by + social_links (jsonb)
-- مع تحويل الـ 44 صنايعي الحاليين (status='approved' + social links من JSON).
-- ============================================================================

BEGIN;

-- تَعطيل الـ guard أثناء التحويل (لا توجد جلسة مشرف أثناء migration)
ALTER TABLE public.craftsmen DISABLE TRIGGER trg_craftsman_owner_update_guard;

-- 1) إلغاء الدوال الوريثة الخاصة بـ join_requests (الـ trigger يسبقها CASCADE)
DROP TRIGGER IF EXISTS trg_join_request_update_guard ON public.join_requests;
DROP FUNCTION IF EXISTS public.approve_join_request(uuid);
DROP FUNCTION IF EXISTS public.guard_join_request_update();

-- 2) تطوير craftsmen إلى النموذج الجديد
ALTER TABLE public.craftsmen
  ALTER COLUMN slug DROP NOT NULL,                        -- الطلبات المعلقة بلا slug
  ADD COLUMN IF NOT EXISTS status        text    NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_by  uuid    REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS social_links  jsonb   NOT NULL DEFAULT '[]';

-- 3) تحويل البيانات الحالية (قبل حذف social_links old table)
UPDATE public.craftsmen SET status = 'approved';

UPDATE public.craftsmen c
SET social_links = COALESCE((
  SELECT jsonb_agg(
           jsonb_build_object('platform', s.platform, 'url', s.url)
           ORDER BY s.created_at
         )
  FROM public.social_links s
  WHERE s.craftsman_id = c.id
), '[]');

-- 4) حذف جداول الـ legacy نهائياً (السياسات والـ triggers تسقط CASCADE)
DROP TABLE IF EXISTS public.join_requests CASCADE;
DROP TABLE IF EXISTS public.social_links  CASCADE;

-- 5) قيود التماسك
ALTER TABLE public.craftsmen
  ADD CONSTRAINT craftsmen_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.craftsmen
  ADD CONSTRAINT craftsmen_publish_requires_approval
    CHECK (is_published = false OR status = 'approved');

-- 6) فهارس
CREATE INDEX IF NOT EXISTS craftsmen_status_idx
  ON public.craftsmen (status);

CREATE UNIQUE INDEX IF NOT EXISTS craftsmen_pending_submitted_unique
  ON public.craftsmen (submitted_by)
  WHERE submitted_by IS NOT NULL AND status = 'pending';

-- 7) RLS — سياسات دورة التقديم
ALTER TABLE public.craftsmen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "craftsmen applicant insert pending" ON public.craftsmen;
CREATE POLICY "craftsmen applicant insert pending"
  ON public.craftsmen FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending'
    AND is_published = false
    AND verified = false
    AND submitted_by = auth.uid()
    AND slug IS NULL
  );

DROP POLICY IF EXISTS "craftsmen applicant read own" ON public.craftsmen;
CREATE POLICY "craftsmen applicant read own"
  ON public.craftsmen FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

-- 8) تحديث الحارس: status و submitted_by حقول إدارية للغير مشرف
CREATE OR REPLACE FUNCTION public.guard_craftsman_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.image_url IS NOT NULL
     AND NEW.image_url NOT LIKE '%/object/public/craftsman-images/craftsmen/'
                          || NEW.id::text || '/%' THEN
    RAISE EXCEPTION 'رابط الصورة غير صالح: يلزم صورة مرفوعة ضمن مجلد الصنايعي الخاص بك'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.is_published IS DISTINCT FROM OLD.is_published
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.name IS DISTINCT FROM OLD.name
     OR NEW.category_id IS DISTINCT FROM OLD.category_id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by THEN
    RAISE EXCEPTION 'الحقول الإدارية (التوثيق، النشر، الرابط، الاسم، التخصص، الحالة) لا تُعدَّل إلا من المشرف';
  END IF;

  RETURN NEW;
END;
$function$;

-- 9) RPC الموافقة على طلب تقديم — توليد slug + نشر + ربط بروفايل المقدم
CREATE OR REPLACE FUNCTION public.approve_craftsman_application(p_craftsman_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_craftsman public.craftsmen;
  v_slug      text;
  v_attempt   int := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  SELECT * INTO v_craftsman
  FROM public.craftsmen
  WHERE id = p_craftsman_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;

  IF v_craftsman.status <> 'pending' THEN
    RAISE EXCEPTION 'الطلب اتعامل معاه من قبل';
  END IF;

  IF v_craftsman.name IS NULL OR v_craftsman.category_id IS NULL
     OR v_craftsman.area_id IS NULL OR v_craftsman.phone IS NULL THEN
    RAISE EXCEPTION 'الطلب ناقص ومحتاج مراجعة يدوية';
  END IF;

  IF v_craftsman.submitted_by IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_craftsman.submitted_by AND craftsman_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'المقدم يمتلك صنايعي بالفعل — اربط حسابه الموجود مباشرة';
    END IF;
  END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_slug := lower(regexp_replace(v_craftsman.name, '[^a-z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    IF length(v_slug) < 3 THEN
      v_slug := 'craftsman';
    END IF;
    v_slug := v_slug || '-' || substr(md5(gen_random_uuid()::text), 1, 8);

    BEGIN
      UPDATE public.craftsmen
      SET status = 'approved',
          is_published = true,
          slug = v_slug
      WHERE id = p_craftsman_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 5 THEN
        RAISE EXCEPTION 'تعذر توليد رابط فريد للصنايعي — جرّب تاني';
      END IF;
    END;
  END LOOP;

  IF v_craftsman.submitted_by IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'craftsman',
        craftsman_id = p_craftsman_id
    WHERE id = v_craftsman.submitted_by;
  END IF;

  RETURN p_craftsman_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.approve_craftsman_application(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_craftsman_application(uuid) TO authenticated;

-- 10) RPC الرفض — حالة نهائية بلا إعادة فتح
CREATE OR REPLACE FUNCTION public.reject_craftsman_application(p_craftsman_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  SELECT status INTO v_status
  FROM public.craftsmen
  WHERE id = p_craftsman_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'الطلب اتعامل معاه من قبل';
  END IF;

  UPDATE public.craftsmen SET status = 'rejected' WHERE id = p_craftsman_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.reject_craftsman_application(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_craftsman_application(uuid) TO authenticated;

-- إعادة تفعيل الـ guard بعد انتهاء التحويل
ALTER TABLE public.craftsmen ENABLE TRIGGER trg_craftsman_owner_update_guard;

COMMIT;