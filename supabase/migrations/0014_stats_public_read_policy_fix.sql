-- ============================================================================
-- 0014 — إصلاح سياسات القراءة العامة (public read) لجدولَي الإحصائيات
-- ----------------------------------------------------------------------------
-- المشكلة: سياسات `craftsman_stats public read` (0011) و
-- `craftsman_stats_daily public read` (0012) صلاحيتها `TO anon, authenticated`
-- وتشمل `OR (SELECT public.is_admin())` — بينما `is_admin()` SECURITY DEFINER
-- بلا EXECUTE لـ anon منذ 0004 (متعمّد). عند قراءة anon لأي صف من هذين
-- الجدولَين (مثال: صفحة الرئيسية تعرّش stats:craftsman_stats) يفشل الاستعلام
-- بالكامل بخطأ: permission denied for function is_admin.
--
-- الحل: قراءة المشرف لكل الصفوف تتحقق أصلاً عبر سياسة `admin all`
-- (FOR ALL TO authenticated USING/WITH CHECK is_admin — authenticated يملك
-- EXECUTE عليها). فتُبقى القراءة العامة فقط على «المنشورون» بلا is_admin،
-- فلا يتبقى مسار anon يستدعي دالة هوية بلا صلاحية. تقييم RLS يجمع السياسات
-- بـ OR: المشرف يحصل على public read (منشورون) + admin all (الكل).
-- ============================================================================

DROP POLICY IF EXISTS "craftsman_stats public read" ON public.craftsman_stats;
CREATE POLICY "craftsman_stats public read"
  ON public.craftsman_stats FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.craftsmen c
      WHERE c.id = craftsman_stats.craftsman_id
        AND c.is_published = true
    )
  );

DROP POLICY IF EXISTS "craftsman_stats_daily public read" ON public.craftsman_stats_daily;
CREATE POLICY "craftsman_stats_daily public read"
  ON public.craftsman_stats_daily FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.craftsmen c
      WHERE c.id = craftsman_stats_daily.craftsman_id
        AND c.is_published = true
    )
  );