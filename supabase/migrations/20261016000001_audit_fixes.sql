-- =============================================================================
-- Migration: 20261016000001_audit_fixes.sql
-- الغرض: إصلاح 4 مشاكل اكتُشفت أثناء Full Code & Migrations Audit
--
--  1. تصحيح مفتاح 'pendingCraftsmen' -> 'pendingRequests' في get_admin_nav_counts()
--  2. استعادة Arabic Semantic Slugs في approve_craftsman_application()
--     مع الحفاظ على منطق owner_user_id وsync_craftsman_role
--  3. إضافة SET search_path للدوال الأربع في 20261005000002/003/004
--  4. تأمين notify_vercel_webhook() - حذف hardcoded secret ودومين قديم
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. إصلاح get_admin_nav_counts(): 'pendingRequests' بدل 'pendingCraftsmen'
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_admin_nav_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending_craftsmen INT;
  v_pending_reports   INT;
  v_unread_messages   INT;
  v_open_leads        INT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT count(*)::INT INTO v_pending_craftsmen FROM craftsmen WHERE status = 'pending';
  SELECT count(*)::INT INTO v_pending_reports   FROM reports  WHERE status = 'pending';
  SELECT count(*)::INT INTO v_unread_messages   FROM contact_messages WHERE is_read = false;
  SELECT count(*)::INT INTO v_open_leads        FROM leads    WHERE status = 'open' AND hidden = false;

  RETURN json_build_object(
    'pendingRequests',  v_pending_craftsmen,
    'pendingCraftsmen', v_pending_craftsmen,
    'pendingReports',   v_pending_reports,
    'unreadMessages',   v_unread_messages,
    'openLeads',        v_open_leads
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_nav_counts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_nav_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_nav_counts() TO authenticated;

-- =============================================================================
-- 2. استعادة Arabic Semantic Slugs في approve_craftsman_application()
-- =============================================================================
CREATE OR REPLACE FUNCTION public.approve_craftsman_application(p_craftsman_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_craftsman      public.craftsmen;
  v_singular_name  text;
  v_clean_name     text;
  v_clean_cat      text;
  v_slug           text;
  v_attempt        int := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_craftsman FROM public.craftsmen WHERE id = p_craftsman_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Craftsman not found'; END IF;
  IF v_craftsman.status <> 'pending' THEN RAISE EXCEPTION 'Application not pending'; END IF;
  IF v_craftsman.name IS NULL OR v_craftsman.category_id IS NULL
     OR v_craftsman.area_id IS NULL OR v_craftsman.phone IS NULL THEN
    RAISE EXCEPTION 'Missing required fields';
  END IF;
  IF v_craftsman.owner_user_id IS NULL THEN
    RAISE EXCEPTION 'Owner user not set';
  END IF;

  -- استخراج singular_name
  SELECT singular_name INTO v_singular_name
  FROM public.categories WHERE id = v_craftsman.category_id;

  -- تنظيف اسم الصنايعي (يقبل عربي + لاتيني + أرقام)
  v_clean_name := lower(regexp_replace(v_craftsman.name, '[^a-zA-Z0-9\u0621-\u064A\u0660-\u0669]+', '-', 'g'));
  v_clean_name := trim(both '-' from v_clean_name);
  v_clean_name := regexp_replace(v_clean_name, '-+', '-', 'g');
  IF length(v_clean_name) < 2 THEN v_clean_name := 'craftsman'; END IF;
  IF length(v_clean_name) > 35 THEN
    v_clean_name := substr(v_clean_name, 1, 35);
    v_clean_name := trim(trailing '-' from v_clean_name);
  END IF;

  -- تنظيف اسم المهنة
  v_clean_cat := lower(regexp_replace(COALESCE(v_singular_name, 'صنايعي'), '[^a-zA-Z0-9\u0621-\u064A\u0660-\u0669]+', '-', 'g'));
  v_clean_cat := trim(both '-' from v_clean_cat);
  v_clean_cat := regexp_replace(v_clean_cat, '-+', '-', 'g');

  LOOP
    v_attempt := v_attempt + 1;
    v_slug := v_clean_cat || '-' || v_clean_name || '-' || substr(md5(gen_random_uuid()::text), 1, 4);
    BEGIN
      UPDATE public.craftsmen
      SET status = 'approved', is_published = true, slug = v_slug
      WHERE id = p_craftsman_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 5 THEN RAISE EXCEPTION 'Could not generate unique slug'; END IF;
    END;
  END LOOP;

  -- تحديث دور المستخدم (من 20261005000000)
  PERFORM public.sync_craftsman_role(v_craftsman.owner_user_id);
  RETURN p_craftsman_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_craftsman_application(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_craftsman_application(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_craftsman_application(uuid) TO authenticated;

-- =============================================================================
-- 3a. notify_craftsman_state + SET search_path (من 20261005000002)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_craftsman_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF OLD.verified IS DISTINCT FROM NEW.verified AND NEW.is_published = OLD.is_published THEN
    v_owner := NEW.owner_user_id;
    IF v_owner IS NOT NULL THEN
      PERFORM public.create_notification(
        v_owner, 'verified',
        CASE WHEN NEW.verified THEN 'بروفايلك اتحقق' ELSE 'إلغاء التوثيق' END,
        CASE WHEN NEW.verified
             THEN '«' || NEW.name || '» بقى موثّق في الدليل - يظهر بشارة موثّق.'
             ELSE 'إلغيت شارة التوثيق من بروفايل «' || NEW.name || '».' END,
        jsonb_build_object('craftsman_id', NEW.id, 'name', NEW.name, 'verified', NEW.verified),
        'verified:' || NEW.id::text || ':' || NEW.verified::text
      );
    END IF;
  END IF;

  IF NEW.is_published IS DISTINCT FROM OLD.is_published AND OLD.status = 'approved' THEN
    v_owner := NEW.owner_user_id;
    IF v_owner IS NOT NULL THEN
      PERFORM public.create_notification(
        v_owner, 'published',
        CASE WHEN NEW.is_published THEN 'بروفايلك اتنشر' ELSE 'بروفايلك اتعمل عليه إخفاء' END,
        CASE WHEN NEW.is_published
             THEN '«' || NEW.name || '» دلوقتي ظاهر للزوار في الدليل.'
             ELSE '«' || NEW.name || '» متخفي عن الدليل - تواصل مع المشرف.' END,
        jsonb_build_object('craftsman_id', NEW.id, 'name', NEW.name, 'published', NEW.is_published),
        'publish:' || NEW.id::text || ':' || NEW.is_published::text
      );
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_craftsman_state() FROM PUBLIC, anon, authenticated;

-- =============================================================================
-- 3b. get_admin_users + SET search_path 'public','auth' (من 20261005000004)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id             uuid,
  display_name   text,
  email          text,
  avatar_url     text,
  role           text,
  craftsman_id   uuid,
  craftsman_name text,
  craftsman_slug text,
  created_at     timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'غير مصرح لك بالوصول إلى بيانات المستخدمين';
  END IF;
  RETURN QUERY
  SELECT p.id, p.display_name, u.email::text, p.avatar_url, p.role,
         c.craftsman_id, c.craftsman_name, c.craftsman_slug, p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN LATERAL (
    SELECT cr.id AS craftsman_id, cr.name AS craftsman_name, cr.slug AS craftsman_slug
    FROM public.craftsmen cr WHERE cr.owner_user_id = p.id
    ORDER BY cr.created_at DESC LIMIT 1
  ) c ON true
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

-- =============================================================================
-- 3c. notify_review_added + SET search_path (من 20261005000003)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_review_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_user_id INTO v_owner FROM public.craftsmen WHERE id = NEW.craftsman_id LIMIT 1;
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM NEW.user_id THEN
    PERFORM public.create_notification(
      v_owner, 'review_added', 'واحد قيّم شغلك',
      COALESCE(NEW.user_name, 'عميل') || ' قيّم بروفايلك ' || NEW.rating::text || ' من 5 نجوم.',
      jsonb_build_object('craftsman_id', NEW.craftsman_id, 'review_id', NEW.id, 'rating', NEW.rating),
      'review:' || NEW.id::text
    );
  END IF;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_review_added() FROM PUBLIC, anon, authenticated;

-- =============================================================================
-- 3d. increment_craftsman_stats + SET search_path (من 20261005000003)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.increment_craftsman_stats(
  p_slug        text,
  p_action      text,
  p_ip          text DEFAULT NULL::text,
  p_user_id     uuid DEFAULT NULL::uuid,
  p_user_status text DEFAULT 'anonymous'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_craftsman_id       uuid;
  v_craftsman_owner_id uuid;
  v_rl                 jsonb;
  v_status_clean       text;
BEGIN
  IF p_slug IS NULL OR length(p_slug) = 0 OR length(p_slug) > 90
     OR p_slug !~ '^[a-z0-9\u0621-\u064A\u0660-\u0669]+(?:-[a-z0-9\u0621-\u064A\u0660-\u0669]+)*$' THEN
    RETURN false;
  END IF;
  IF p_action IS NULL OR p_action NOT IN ('view', 'call', 'whatsapp') THEN
    RETURN false;
  END IF;
  v_status_clean := CASE WHEN p_user_status IN ('authenticated', 'anonymous') THEN p_user_status ELSE 'anonymous' END;
  SELECT public.rate_limit_consume('stats:rpc:' || coalesce(p_ip, '0.0.0.0') || ':' || p_slug, 120, 60) INTO v_rl;
  IF NOT coalesce((v_rl->>'allowed')::boolean, false) THEN RETURN false; END IF;
  SELECT id, owner_user_id INTO v_craftsman_id, v_craftsman_owner_id
  FROM public.craftsmen WHERE slug = p_slug AND is_published = true;
  IF v_craftsman_id IS NULL THEN RETURN false; END IF;
  IF p_user_id IS NOT NULL AND p_user_id = v_craftsman_owner_id THEN RETURN true; END IF;

  INSERT INTO public.craftsman_stats (craftsman_id, views, calls, whatsapp)
  VALUES (v_craftsman_id,
    CASE WHEN p_action = 'view'     THEN 1 ELSE 0 END,
    CASE WHEN p_action = 'call'     THEN 1 ELSE 0 END,
    CASE WHEN p_action = 'whatsapp' THEN 1 ELSE 0 END)
  ON CONFLICT (craftsman_id) DO UPDATE SET
    views    = CASE WHEN p_action = 'view'     THEN public.craftsman_stats.views    + 1 ELSE public.craftsman_stats.views    END,
    calls    = CASE WHEN p_action = 'call'     THEN public.craftsman_stats.calls    + 1 ELSE public.craftsman_stats.calls    END,
    whatsapp = CASE WHEN p_action = 'whatsapp' THEN public.craftsman_stats.whatsapp + 1 ELSE public.craftsman_stats.whatsapp END,
    updated_at = now();

  INSERT INTO public.craftsman_stats_daily (craftsman_id, day, views, calls, whatsapp)
  VALUES (v_craftsman_id, current_date,
    CASE WHEN p_action = 'view'     THEN 1 ELSE 0 END,
    CASE WHEN p_action = 'call'     THEN 1 ELSE 0 END,
    CASE WHEN p_action = 'whatsapp' THEN 1 ELSE 0 END)
  ON CONFLICT (craftsman_id, day) DO UPDATE SET
    views    = public.craftsman_stats_daily.views    + excluded.views,
    calls    = public.craftsman_stats_daily.calls    + excluded.calls,
    whatsapp = public.craftsman_stats_daily.whatsapp + excluded.whatsapp;

  IF p_action IN ('call', 'whatsapp') THEN
    INSERT INTO public.interaction_logs (craftsman_id, contact_method, user_id, user_status)
    VALUES (v_craftsman_id, CASE WHEN p_action = 'call' THEN 'phone' ELSE 'whatsapp' END, p_user_id, v_status_clean);
  END IF;
  RETURN true;
END;
$$;

-- =============================================================================
-- 3e. normalize_arabic + SET search_path (من 0022_search_craftsmen_fts)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.normalize_arabic(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path TO 'public'
AS $$
  SELECT lower(
    regexp_replace(
      translate(
        regexp_replace(coalesce(p_text, ''), '[\u064B-\u0652\u0670\u0640\uFEFF]', '', 'g'),
        'أإآءةى',
        'ااااهي'
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

-- =============================================================================
-- 4. تأمين notify_vercel_webhook() - حذف hardcoded secret ودومين قديم
--    fail-closed: إذا كان السر فارغاً لا يُرسَل أي Webhook
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_vercel_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_url               text;
  v_secret            text;
  v_payload           jsonb;
  v_category_slug     text;
  v_old_category_slug text;
  v_craftsman_slug    text;
BEGIN
  -- الرابط: من الإعدادات أولاً، والدومين الجديد fallback آمن (لا دومين قديم)
  v_url := NULLIF(TRIM(COALESCE(current_setting('app.settings.vercel_webhook_url', true), '')), '');
  IF v_url IS NULL OR v_url = '' THEN
    v_url := 'https://daleel-al-suez.com/api/webhooks/supabase';
  END IF;

  -- السر: من الإعدادات فقط - بلا fallback سري (fail-closed أمان محافظ)
  v_secret := NULLIF(TRIM(COALESCE(current_setting('app.settings.supabase_webhook_secret', true), '')), '');
  IF v_secret IS NULL OR v_secret = '' THEN
    -- لا سر مضبوط = لا webhook = آمن
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_TABLE_NAME = 'craftsmen' THEN
    IF NEW.category_id IS NOT NULL THEN
      SELECT slug INTO v_category_slug FROM public.categories WHERE id = NEW.category_id;
    END IF;
    IF OLD.category_id IS NOT NULL AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      SELECT slug INTO v_old_category_slug FROM public.categories WHERE id = OLD.category_id;
    END IF;
  END IF;

  IF TG_TABLE_NAME IN ('reviews', 'craftsman_stats') THEN
    IF NEW.craftsman_id IS NOT NULL THEN
      SELECT slug INTO v_craftsman_slug FROM public.craftsmen WHERE id = NEW.craftsman_id;
    ELSIF OLD.craftsman_id IS NOT NULL THEN
      SELECT slug INTO v_craftsman_slug FROM public.craftsmen WHERE id = OLD.craftsman_id;
    END IF;
  END IF;

  v_payload := jsonb_build_object(
    'type',              TG_OP,
    'table',             TG_TABLE_NAME,
    'record',            to_jsonb(NEW),
    'old_record',        to_jsonb(OLD),
    'category_slug',     v_category_slug,
    'old_category_slug', v_old_category_slug,
    'craftsman_slug',    v_craftsman_slug
  );

  PERFORM net.http_post(
    url     => v_url,
    headers => jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body    => v_payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.notify_vercel_webhook() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_lead_status_transition() FROM PUBLIC, anon, authenticated;

COMMIT;
