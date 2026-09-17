-- ============================================================================
-- 0005_craftsmen_refinements.sql — مرحلة 3 (تكمّيل): ضبط craftsmen
-- ----------------------------------------------------------------------------
-- يغلق الفجوات الثلاث من مراجعة الموديل:
--   1) updated_at على craftsmen + تريّج تلقائي (الطابع عند كل تعديل).
--   2) قرار phone موثّق: التكرار مسموح (ورشتان/فروع برقم مشترك) — الفهرس
--      العادي بدل الفريد لدعم البحث بالرقم دون منع المشاركة.
--   3) فهرس عادي على submitted_by (الموجود فريد جزئي لـ pending فقط — يغطي
--      قراءات تقديمات المقدّم المنشورة/المرفوضة أيضاً).
-- idempotent ويطابق الـ live.
-- ============================================================================

BEGIN;

-- 1) عمود updated_at + قيم سابقة (زمن الإنشاء) + NOT NULL
ALTER TABLE public.craftsmen
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2) فهارس القرارات
--    phone: تكرار مسموح (لا فريد) — فهرس عادي للبحث بالرقم مستقبلاً
CREATE INDEX IF NOT EXISTS craftsmen_phone_idx
  ON public.craftsmen (phone);

--    submitted_by: فهرس عادي بجانب الفريد الجزئي (pending) لقراءات المقدّم
CREATE INDEX IF NOT EXISTS craftsmen_submitted_by_idx
  ON public.craftsmen (submitted_by);

-- 3) تريّج طابع updated_at — دالة بسيطة بلا SECURITY DEFINER (لا بيانات حساسة)
CREATE OR REPLACE FUNCTION public.touch_craftsmen_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_craftsmen_updated_at ON public.craftsmen;
CREATE TRIGGER trg_craftsmen_updated_at
  BEFORE UPDATE ON public.craftsmen
  FOR EACH ROW EXECUTE FUNCTION public.touch_craftsmen_updated_at();

-- لا EXECUTE عام لأي دالة trigger
REVOKE EXECUTE ON FUNCTION public.touch_craftsmen_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_craftsmen_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.touch_craftsmen_updated_at() FROM authenticated;

COMMIT;