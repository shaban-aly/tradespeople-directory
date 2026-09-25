BEGIN;

-- 1) إضافة النوع الجديد
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'join_approved', 'join_rejected', 'verified', 'published',
    'account_linked', 'review_added', 'report_status',
    'new_request', 'new_report', 'new_message', 'new_craftsman',
    'welcome', 'admin_broadcast'
  )
);

-- 2) RPC broadcast_admin_notification
CREATE OR REPLACE FUNCTION public.broadcast_admin_notification(
  p_title    text,
  p_body     text,
  p_link     text  DEFAULT NULL,
  p_audience text  DEFAULT 'all',
  p_user_id  uuid  DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count    integer := 0;
  v_metadata jsonb;
BEGIN
  -- تحقق الدور (auth.uid() يعمل لأن client يحمل الجلسة عبر cookies)
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- تحقق المدخلات
  IF p_title IS NULL OR char_length(p_title) < 2 OR char_length(p_title) > 200 THEN
    RAISE EXCEPTION 'invalid title';
  END IF;
  IF p_body IS NULL OR char_length(p_body) < 2 OR char_length(p_body) > 1000 THEN
    RAISE EXCEPTION 'invalid body';
  END IF;
  IF p_audience NOT IN ('all', 'craftsmen', 'clients', 'user_id') THEN
    RAISE EXCEPTION 'invalid audience';
  END IF;
  IF p_audience = 'user_id' AND p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;
  IF p_link IS NOT NULL AND char_length(p_link) > 500 THEN
    RAISE EXCEPTION 'link too long';
  END IF;

  -- بناء metadata
  v_metadata := jsonb_build_object('sent_by', auth.uid(), 'audience', p_audience);
  IF p_link IS NOT NULL THEN
    v_metadata := v_metadata || jsonb_build_object('link', p_link);
  END IF;

  -- الإرسال حسب الجمهور
  IF p_audience = 'user_id' THEN
    PERFORM public.create_notification(
      p_user_id, 
      'admin_broadcast', 
      p_title, 
      p_body, 
      v_metadata, 
      'broadcast:' || p_user_id::text || ':' || gen_random_uuid()::text
    );
    v_count := 1;
  ELSE
    INSERT INTO public.notifications (recipient_id, type, title, body, key, metadata)
    SELECT
      p.id,
      'admin_broadcast',
      p_title,
      p_body,
      'broadcast:' || p.id::text || ':' || gen_random_uuid()::text,
      v_metadata
    FROM public.profiles p
    WHERE
      CASE p_audience
        WHEN 'all'       THEN p.role IN ('client', 'craftsman')
        WHEN 'craftsmen' THEN p.role = 'craftsman'
        WHEN 'clients'   THEN p.role = 'client'
      END
    ON CONFLICT (key) DO NOTHING;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN v_count;
END;
$$;

-- EXECUTE لـ authenticated فقط (is_admin() يحمي داخلياً)
REVOKE ALL ON FUNCTION public.broadcast_admin_notification(text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.broadcast_admin_notification(text, text, text, text, uuid) TO authenticated;

COMMIT;
