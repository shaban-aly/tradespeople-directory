-- ============================================================================
-- 0030_interaction_logs_craftsman_read.sql — تمكين الفني من قراءة سجل تفاعلاته
-- ----------------------------------------------------------------------------
-- ينشئ:
--   1) سياسة RLS: `interaction_logs craftsman read own` لقراءة سجلات الفني الخاصة فقط.
--   2) RPC اختياري سريع: `get_craftsman_activity_feed` لجلب آخر التفاعلات الخاصة بالفني.
-- ============================================================================

BEGIN;

-- 1) سياسة قراءة الفني لسجلاته الخاصة
DROP POLICY IF EXISTS "interaction_logs craftsman read own" ON public.interaction_logs;
CREATE POLICY "interaction_logs craftsman read own"
  ON public.interaction_logs
  FOR SELECT
  TO authenticated
  USING (craftsman_id = (SELECT public.get_my_craftsman_id()));

-- 2) دالة استعلام سريعة للوحة تحكم الفني
CREATE OR REPLACE FUNCTION public.get_craftsman_activity_feed(
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  log_id bigint,
  contact_method text,
  user_status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_craftsman_id uuid;
BEGIN
  v_craftsman_id := (SELECT public.get_my_craftsman_id());
  IF v_craftsman_id IS NULL THEN
    RETURN;
  END IF;

  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 50 THEN
    p_limit := 20;
  END IF;

  RETURN QUERY
  SELECT 
    l.id AS log_id,
    l.contact_method,
    l.user_status,
    l.created_at
  FROM public.interaction_logs l
  WHERE l.craftsman_id = v_craftsman_id
  ORDER BY l.created_at DESC
  LIMIT p_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_craftsman_activity_feed(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_craftsman_activity_feed(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_craftsman_activity_feed(integer) TO authenticated;

COMMENT ON POLICY "interaction_logs craftsman read own" ON public.interaction_logs IS
  'تتيح للفني المسجل قراءة سجلات التفاعل الخاصة بملفه فقط';

COMMIT;
