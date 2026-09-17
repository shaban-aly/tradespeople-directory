-- ============================================================================
-- 0002_restrict_rpc_execute.sql
-- ----------------------------------------------------------------------------
-- default privileges في المشروع تمنح anon EXECUTE تلقائياً على أي دالة جديدة.
-- دالتا الموافقة/الرفض SECURITY DEFINER — يُحظر استدعاؤهما من anon نهائياً.
-- (الحماية الفعلية داخل الدالة بـ is_admin() كطبقة ثانية.)
-- ============================================================================

BEGIN;

REVOKE EXECUTE ON FUNCTION public.approve_craftsman_application(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_craftsman_application(uuid) FROM anon;

COMMIT;