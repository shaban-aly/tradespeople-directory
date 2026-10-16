-- =============================================================================
-- Migration: 20261016000002_performance_and_indexes.sql
-- الغرض: تحسين أداء وحماية قاعدة البيانات وفقاً لمعايير Supabase Linter & Best Practices
--
--  1. إنشاء فهارس تغطية للمفاتيح الأجنبية (Covering Indexes for Unindexed Foreign Keys)
--  2. إصلاح سياسات RLS باستخدام (SELECT auth.uid()) لمنع إعادة التقييم لكل صف (auth_rls_initplan)
--  3. تنظيف وتوحيد السياسات المتكررة (Multiple Permissive Policies)
--  4. توفير سياسات RLS صريحة للجداول الداخلية (rls_enabled_no_policy)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. فهارس المفاتيح الأجنبية المفقودة (Unindexed Foreign Keys)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_area_id
  ON public.leads(area_id);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_user_id
  ON public.interaction_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_user_id
  ON public.reports(reporter_user_id);

CREATE INDEX IF NOT EXISTS idx_anonymous_push_outbox_craftsman_id
  ON public.anonymous_push_outbox(craftsman_id);

CREATE INDEX IF NOT EXISTS idx_notification_push_deliveries_token_id
  ON public.notification_push_deliveries(token_id);

CREATE INDEX IF NOT EXISTS idx_notification_push_outbox_recipient_id
  ON public.notification_push_outbox(recipient_id);

CREATE INDEX IF NOT EXISTS idx_push_client_diagnostics_user_id
  ON public.push_client_diagnostics(user_id);

-- =============================================================================
-- 2. إزالة الازدواجية وضبط SELECT لجدولي areas و categories
-- =============================================================================
-- استبدال FOR ALL بـ INSERT/UPDATE/DELETE للمشرف حتى لا تتداخل مع SELECT العامة
DROP POLICY IF EXISTS "areas admin write" ON public.areas;
CREATE POLICY "areas admin write"
  ON public.areas FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "areas admin update"
  ON public.areas FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "areas admin delete"
  ON public.areas FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "categories admin write" ON public.categories;
CREATE POLICY "categories admin write"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "categories admin update"
  ON public.categories FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "categories admin delete"
  ON public.categories FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- =============================================================================
-- 3. توحيد وإصلاح سياسات RLS لجدول craftsmen (InitPlan + إزالة الازدواجية)
-- =============================================================================
DROP POLICY IF EXISTS "Craftsmen are viewable by everyone if published" ON public.craftsmen;
DROP POLICY IF EXISTS "craftsmen public read published" ON public.craftsmen;
DROP POLICY IF EXISTS "Users can view their owned profiles" ON public.craftsmen;
DROP POLICY IF EXISTS "Users can view their submitted applications" ON public.craftsmen;
DROP POLICY IF EXISTS "craftsmen applicant read own" ON public.craftsmen;
DROP POLICY IF EXISTS "craftsmen admin write" ON public.craftsmen;
DROP POLICY IF EXISTS "craftsmen applicant insert pending" ON public.craftsmen;
DROP POLICY IF EXISTS "Users can update their owned profiles" ON public.craftsmen;

-- قراءة عامة للصناع المنشورين والمعتمدين فقط
CREATE POLICY "craftsmen public read published"
  ON public.craftsmen FOR SELECT
  USING (is_published = true AND status = 'approved');

-- قراءة خاصة للصانع لملفه الشخصي أو طلباته المعلقة أو المشرف
CREATE POLICY "craftsmen read own"
  ON public.craftsmen FOR SELECT TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid())
    OR submitted_by = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

-- تقديم طلب جديد من قبل المستخدم المسجل
CREATE POLICY "craftsmen applicant insert pending"
  ON public.craftsmen FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending'
    AND is_published = false
    AND verified = false
    AND submitted_by = (SELECT auth.uid())
    AND owner_user_id = (SELECT auth.uid())
    AND slug IS NULL
  );

-- تحديث الصانع لملفه أو المشرف
CREATE POLICY "craftsmen update own"
  ON public.craftsmen FOR UPDATE TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    owner_user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

-- حذف للصانع بواسطة المشرف فقط
CREATE POLICY "craftsmen admin delete"
  ON public.craftsmen FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- =============================================================================
-- 4. إصلاح وتوحيد سياسات craftsman_stats و craftsman_stats_daily
-- =============================================================================
DROP POLICY IF EXISTS "Craftsman stats are viewable by everyone if published" ON public.craftsman_stats;
DROP POLICY IF EXISTS "craftsman_stats public read" ON public.craftsman_stats;
DROP POLICY IF EXISTS "Users can view stats of their owned craftsmen" ON public.craftsman_stats;
DROP POLICY IF EXISTS "Users can update stats of their owned craftsmen" ON public.craftsman_stats;
DROP POLICY IF EXISTS "craftsman_stats admin all" ON public.craftsman_stats;

CREATE POLICY "craftsman_stats public read"
  ON public.craftsman_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.craftsmen c
    WHERE c.id = craftsman_stats.craftsman_id AND c.is_published = true
  ));

CREATE POLICY "craftsman_stats read own"
  ON public.craftsman_stats FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.craftsmen c
      WHERE c.id = craftsman_stats.craftsman_id
        AND (c.owner_user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
    )
  );

DROP POLICY IF EXISTS "Users can view daily stats of their owned craftsmen" ON public.craftsman_stats_daily;
DROP POLICY IF EXISTS "craftsman_stats_daily admin all" ON public.craftsman_stats_daily;
DROP POLICY IF EXISTS "craftsman_stats_daily public read" ON public.craftsman_stats_daily;

CREATE POLICY "craftsman_stats_daily read own"
  ON public.craftsman_stats_daily FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.craftsmen c
      WHERE c.id = craftsman_stats_daily.craftsman_id
        AND (c.owner_user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
    )
  );

-- =============================================================================
-- 5. إصلاح سياسات interaction_logs
-- =============================================================================
DROP POLICY IF EXISTS "Users can view interaction logs of their owned craftsmen" ON public.interaction_logs;
DROP POLICY IF EXISTS "interaction_logs admin all" ON public.interaction_logs;

CREATE POLICY "interaction_logs read own"
  ON public.interaction_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.craftsmen c
      WHERE c.id = interaction_logs.craftsman_id
        AND (c.owner_user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
    )
  );

-- =============================================================================
-- 6. إصلاح وتوحيد سياسات leads و lead_responses
-- =============================================================================
DROP POLICY IF EXISTS "customers_view_own_leads" ON public.leads;
DROP POLICY IF EXISTS "craftsmen_view_open_leads" ON public.leads;
DROP POLICY IF EXISTS "craftsmen_view_claimed_leads" ON public.leads;
DROP POLICY IF EXISTS "admins_view_all_leads" ON public.leads;
DROP POLICY IF EXISTS "leads owner read" ON public.leads;
DROP POLICY IF EXISTS "leads admin all" ON public.leads;
DROP POLICY IF EXISTS "customers_insert_lead" ON public.leads;
DROP POLICY IF EXISTS "customers_update_own_open_lead" ON public.leads;

-- قراءة الطلبات: العميل يرى طلباته، الصانع يرى المفتوح أو ما شارك فيه، والمشرف يرى الكل
CREATE POLICY "leads select allowed" ON public.leads
  FOR SELECT TO authenticated
  USING (
    customer_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
    OR (
      status = 'open' AND category_id IN (
        SELECT category_id FROM public.craftsmen
        WHERE owner_user_id = (SELECT auth.uid()) AND status = 'approved'
      )
    )
    OR (
      id IN (
        SELECT lead_id FROM public.lead_responses
        WHERE craftsman_id IN (
          SELECT id FROM public.craftsmen WHERE owner_user_id = (SELECT auth.uid())
        )
      )
    )
  );

CREATE POLICY "customers_insert_lead" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    (customer_id = (SELECT auth.uid()) AND status = 'open')
    OR (SELECT public.is_admin())
  );

CREATE POLICY "customers_update_own_open_lead" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    (customer_id = (SELECT auth.uid()) AND status = 'open')
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    (customer_id = (SELECT auth.uid()) AND status = 'open')
    OR (SELECT public.is_admin())
  );

CREATE POLICY "leads admin delete" ON public.leads
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- جدول lead_responses
DROP POLICY IF EXISTS "craftsmen_view_own_responses" ON public.lead_responses;
DROP POLICY IF EXISTS "customers_view_lead_responses" ON public.lead_responses;
DROP POLICY IF EXISTS "lead_responses admin all" ON public.lead_responses;
DROP POLICY IF EXISTS "lead_responses craftsman read" ON public.lead_responses;
DROP POLICY IF EXISTS "lead_responses public read" ON public.lead_responses;

CREATE POLICY "lead_responses select allowed" ON public.lead_responses
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin())
    OR lead_id IN (
      SELECT id FROM public.leads WHERE customer_id = (SELECT auth.uid())
    )
    OR craftsman_id IN (
      SELECT id FROM public.craftsmen WHERE owner_user_id = (SELECT auth.uid())
    )
  );

-- =============================================================================
-- 7. إصلاح سياسات profiles
-- =============================================================================
DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin all" ON public.profiles;
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;

CREATE POLICY "profiles read own"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "profiles update own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- =============================================================================
-- 8. إصلاح وتوحيد سياسات favorites و reviews
-- =============================================================================
DROP POLICY IF EXISTS "favorites user select own" ON public.favorites;
DROP POLICY IF EXISTS "favorites user insert own" ON public.favorites;
DROP POLICY IF EXISTS "favorites user delete own" ON public.favorites;
DROP POLICY IF EXISTS "favorites admin all" ON public.favorites;

CREATE POLICY "favorites user select own"
  ON public.favorites FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "favorites user insert own"
  ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "favorites user delete own"
  ON public.favorites FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- جدول reviews
DROP POLICY IF EXISTS "reviews user insert own" ON public.reviews;
DROP POLICY IF EXISTS "reviews user update own" ON public.reviews;
DROP POLICY IF EXISTS "reviews user delete own" ON public.reviews;
DROP POLICY IF EXISTS "reviews admin all" ON public.reviews;

CREATE POLICY "reviews user insert own"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "reviews user update own"
  ON public.reviews FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "reviews user delete own"
  ON public.reviews FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- =============================================================================
-- 9. إصلاح سياسات notifications و user_push_tokens و user_interest_subscriptions
-- =============================================================================
DROP POLICY IF EXISTS "notifications recipient read own" ON public.notifications;
CREATE POLICY "notifications recipient read own"
  ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "push tokens read own" ON public.user_push_tokens;
DROP POLICY IF EXISTS "push tokens delete own" ON public.user_push_tokens;

CREATE POLICY "push tokens read own"
  ON public.user_push_tokens FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "push tokens delete own"
  ON public.user_push_tokens FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "user interests read own" ON public.user_interest_subscriptions;
DROP POLICY IF EXISTS "user interests insert own" ON public.user_interest_subscriptions;
DROP POLICY IF EXISTS "user interests delete own" ON public.user_interest_subscriptions;
DROP POLICY IF EXISTS "user interests update own" ON public.user_interest_subscriptions;

CREATE POLICY "user interests read own"
  ON public.user_interest_subscriptions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "user interests insert own"
  ON public.user_interest_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "user interests delete own"
  ON public.user_interest_subscriptions FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "user interests update own"
  ON public.user_interest_subscriptions FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- =============================================================================
-- 10. إصلاح سياسات reports و contact_messages
-- =============================================================================
DROP POLICY IF EXISTS "reports user submit" ON public.reports;
CREATE POLICY "reports user submit"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_user_id = (SELECT auth.uid())
    AND reporter_user_id IS NOT NULL
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "contact_messages admin all" ON public.contact_messages;
CREATE POLICY "contact_messages admin select"
  ON public.contact_messages FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));
CREATE POLICY "contact_messages admin update"
  ON public.contact_messages FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "contact_messages admin delete"
  ON public.contact_messages FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- =============================================================================
-- 11. تأمين الجداول الداخلية وتوفير سياسة RLS صريحة للمشرف (rls_enabled_no_policy)
-- =============================================================================
REVOKE ALL ON public.rate_limits FROM anon;
REVOKE ALL ON public.push_settings FROM anon;
REVOKE ALL ON public.anonymous_push_outbox FROM anon;
REVOKE ALL ON public.anonymous_push_subscriptions FROM anon;
REVOKE ALL ON public.notification_push_deliveries FROM anon;
REVOKE ALL ON public.notification_push_outbox FROM anon;

DROP POLICY IF EXISTS "admin_manage_rate_limits" ON public.rate_limits;
CREATE POLICY "admin_manage_rate_limits"
  ON public.rate_limits FOR ALL TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "admin_manage_push_settings" ON public.push_settings;
CREATE POLICY "admin_manage_push_settings"
  ON public.push_settings FOR ALL TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "admin_manage_anonymous_push_outbox" ON public.anonymous_push_outbox;
CREATE POLICY "admin_manage_anonymous_push_outbox"
  ON public.anonymous_push_outbox FOR ALL TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "admin_manage_anonymous_push_subscriptions" ON public.anonymous_push_subscriptions;
CREATE POLICY "admin_manage_anonymous_push_subscriptions"
  ON public.anonymous_push_subscriptions FOR ALL TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "admin_manage_notification_push_deliveries" ON public.notification_push_deliveries;
CREATE POLICY "admin_manage_notification_push_deliveries"
  ON public.notification_push_deliveries FOR ALL TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "admin_manage_notification_push_outbox" ON public.notification_push_outbox;
CREATE POLICY "admin_manage_notification_push_outbox"
  ON public.notification_push_outbox FOR ALL TO authenticated
  USING ((SELECT public.is_admin()));

INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20261016000002') ON CONFLICT DO NOTHING;

COMMIT;

