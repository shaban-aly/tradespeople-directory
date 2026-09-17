-- ============================================================================
-- 0009_infrastructure_storage_rate_limits.sql — المرحلة 6: بنية أساسية
--                                   (Storage + rate_limits)
-- ----------------------------------------------------------------------------
-- يكمل البنية الأساسية التي أُنشئت قديماً خارج السلسلة ويشفّر الحماية:
--   1) Storage:
--      - bucket `craftsman-images` (عام — صور مُنشورة فعلاً) يُعلَن في
--        السلسلة + **حدود حقيقية على الـ bucket** (file_size_limit = 5MB،
--        allowed_mime_types = jpeg/png/webp) بدل الاعتماد على فحص الامتداد فقط.
--      - bucket `requests` الخاص/الفارغ/غير المستخدم **يُبقى كـ legacy**
--        (الحذف المباشر من جداول storage محظور عمداً بحارس `protect_delete`).
--      - سياسات storage.objects تُعاد صراحةً (DROP + CREATE) بلا `auth.role()`:
--        admin manage (ALL)، anon/authenticated upload إلى requests/ فقط،
--        owner upload إلى craftsmen/<craftsman_id>/ عبر
--        `(SELECT public.get_my_craftsman_id())` (بدل subquery مباشرة على
--        profiles)، owner read/delete.
--   2) rate_limits:
--      - جدول `rate_limits` (key PK، window_start، count، updated_at) في
--        السلسلة — RLS مفعّل بلا سياسات وبلا grants للـ anon/authenticated
--        (سيرفر فقط عبر دالة SECURITY DEFINER).
--      - دالة `rate_limit_consume(key, limit, seconds)` SECURITY DEFINER
--        محدّدة مدخلاتها داخلياً (max limit 5000، window ≤ 86400s، key ≤512)
--        تعيد {allowed, remaining, retry_after} فقط ولا تكشف أي بيانات أخرى.
--        منح EXECUTE صريح لـ anon + authenticated (بلا PUBLIC) — استثناء
--        توثيقي لأن الراوات العامة تستدعيها بعميل anon/authenticated.
-- Idempotent: INSERT ... ON CONFLICT / CREATE IF NOT EXISTS / DROP IF EXISTS.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Storage buckets
-- ---------------------------------------------------------------------------

-- مجلد الصور العام (صور مُنشورة في صفحات عامة فعلية) + حدود فعلية على الـ bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'craftsman-images',
  'craftsman-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- bucket `requests` القديم: خاص/فارغ (0 كائنات)/غير مستخدم — يُبقى كما هو.
-- لا يمكن حذفه عبر SQL عمداً (trigger `storage.protect_delete()` يمنع الحذف
-- المباشر من جداول storage لحماية الكائنات؛ والحذف عبر API خارج نطاق migration)،
-- وبقاؤه فارغاً وغير مرجع بأي كود = غير ضار. يظل موثّقاً كـ legacy.

-- ---------------------------------------------------------------------------
-- 2) سياسات storage.objects (يعيد تعريفها صراحةً — حذف ثم إنشاء)
-- ---------------------------------------------------------------------------

-- admin: إدارة كاملة (قراءة/كتابة/حذف أي صورة) عبر is_admin() — بلا auth.role()
DROP POLICY IF EXISTS "craftsman-images admin manage" ON storage.objects;
CREATE POLICY "craftsman-images admin manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'craftsman-images' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'craftsman-images' AND (SELECT public.is_admin()));

-- التقديم العام (requests/ فقط) — anon و authenticated بالتوازي
DROP POLICY IF EXISTS "craftsman-images anon upload requests" ON storage.objects;
CREATE POLICY "craftsman-images anon upload requests"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'craftsman-images'
    AND (storage.foldername(name))[1] = 'requests'
  );

-- الفني: الرفع في مجلده craftsmen/<craftsman_id>/ فقط (مصدر الملكية =
-- get_my_craftsman_id() — لا قيمة من العميل)
DROP POLICY IF EXISTS "craftsman-images owner upload" ON storage.objects;
CREATE POLICY "craftsman-images owner upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'craftsman-images'
    AND (storage.foldername(name))[1] = 'craftsmen'
    AND (storage.foldername(name))[2] = (SELECT public.get_my_craftsman_id())::text
  );

-- المالك: قراءة/حذف ملفاته (المشرف مغطى بسياسة admin manage)
DROP POLICY IF EXISTS "craftsman-images owner read" ON storage.objects;
CREATE POLICY "craftsman-images owner read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'craftsman-images' AND owner = auth.uid());

DROP POLICY IF EXISTS "craftsman-images owner delete" ON storage.objects;
CREATE POLICY "craftsman-images owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'craftsman-images' AND owner = auth.uid());

-- ---------------------------------------------------------------------------
-- 3) rate_limits — جدول سيرفر فقط
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key          text        PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count        integer     NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS مفعّل بلا سياسات، وبلا منح DML لأي دور (التخزين المشترك للـ server فقط)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.rate_limits FROM PUBLIC;
REVOKE ALL ON public.rate_limits FROM anon;
REVOKE ALL ON public.rate_limits FROM authenticated;

-- فهرس تنظيف النوافذ القديمة
CREATE INDEX IF NOT EXISTS rate_limits_updated_at_idx
  ON public.rate_limits (updated_at);

-- ---------------------------------------------------------------------------
-- 4) rate_limit_consume — استهلاك نافذة زمنية بمخزن مشترك (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
-- استثناء توثيقي للمنحة العامة: الراوات العامة (sign-upload/stats) تستدعيها
-- بعميل anon/authenticated، لذا تُمنح EXECUTE صراحةً للدورين (بلا PUBLIC)،
-- والدالة تحدّد مدخلاتها داخلياً (limit ≤ 5000، window ≤ 86400s، key ≤ 512)
-- وتعيد {allowed, remaining, retry_after} فقط.
CREATE OR REPLACE FUNCTION public.rate_limit_consume(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_limit integer;
  v_window_seconds integer;
  v_window_start timestamptz;
  v_count integer;
  v_now timestamptz := now();
BEGIN
  IF p_key IS NULL OR p_key = '' OR length(p_key) > 512 THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'retry_after', 0);
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 1), 1), 5000);
  v_window_seconds :=
    LEAST(GREATEST(COALESCE(p_window_seconds, 60), 1), 86400);

  v_window_start := to_timestamp(
    floor(extract(epoch FROM v_now) / v_window_seconds) * v_window_seconds
  );

  INSERT INTO public.rate_limits (key, window_start, count, updated_at)
  VALUES (p_key, v_window_start, 1, v_now)
  ON CONFLICT (key) DO UPDATE
  SET count = CASE
        WHEN public.rate_limits.window_start = excluded.window_start
          THEN public.rate_limits.count + 1
        ELSE 1
      END,
      window_start = excluded.window_start,
      updated_at = v_now
  RETURNING count INTO v_count;

  -- تنظيف النوافذ القديمة (تبرير حدّي يحافظ على حجم الجدول)
  DELETE FROM public.rate_limits
   WHERE updated_at < v_now - interval '2 hours';

  IF v_count > v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retry_after',
        GREATEST(1, ceil(
          extract(epoch FROM (
            v_window_start + make_interval(secs => v_window_seconds) - v_now
          ))
        ))
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_limit - v_count,
    'retry_after', 0
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.rate_limit_consume(text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rate_limit_consume(text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rate_limit_consume(text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_consume(text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.rate_limit_consume(text, integer, integer) TO authenticated;

COMMIT;