-- Migration 0019: دعم UPDATE وسياسة التحديث لجدول user_interest_subscriptions
-- تتيح upsert من الواجهة وتمنع خطأ 403 Forbidden عند المزامنة

GRANT UPDATE ON public.user_interest_subscriptions TO authenticated;

DROP POLICY IF EXISTS "user interests update own" ON public.user_interest_subscriptions;
CREATE POLICY "user interests update own"
  ON public.user_interest_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
