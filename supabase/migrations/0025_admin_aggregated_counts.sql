-- ============================================================================
-- 0025_admin_aggregated_counts.sql — دمج عدّادات لوحة المشرف في استعلامات RPC مجمعة
-- ----------------------------------------------------------------------------
-- 1) get_admin_nav_counts():
--    تجمع عدادات شريط التنقل (الطلبات المعلقة، البلاغات المعلقة، والرسائل غير المقروءة)
--    في استدعاء شبكي واحد بدلاً من 3 استعلامات منفصلة.
--
-- 2) get_admin_breakdown_counts():
--    تُجري التجميع الإحصائي لأعداد الصنايعية لكل تصنيف ولكل منطقة في قاعدة البيانات مباشرةً
--    وتُرجع النتيجة كـ JSON مجمّع، لمنع تحميل كافة صفوف الصنايعية عبر الـ API.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. عدادات القائمة الجانبية (شريط التنقل)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_nav_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح — يلزم المشرف' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'pendingRequests', (SELECT count(*)::integer FROM public.craftsmen WHERE status = 'pending'),
    'pendingReports',  (SELECT count(*)::integer FROM public.reports WHERE status = 'pending'),
    'unreadMessages',  (SELECT count(*)::integer FROM public.contact_messages WHERE is_read = false)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_nav_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_nav_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_nav_counts() TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. توزيع أعداد الصنايعية حسب التخصص والمنطقة
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_breakdown_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح — يلزم المشرف' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'byCategory', (
      SELECT coalesce(jsonb_object_agg(slug, c), '{}'::jsonb)
      FROM (
        SELECT cat.slug, count(cr.id)::integer AS c
        FROM public.categories cat
        LEFT JOIN public.craftsmen cr ON cr.category_id = cat.id
        GROUP BY cat.slug
      ) sub
    ),
    'byArea', (
      SELECT coalesce(jsonb_object_agg(name, c), '{}'::jsonb)
      FROM (
        SELECT a.name, count(cr.id)::integer AS c
        FROM public.areas a
        LEFT JOIN public.craftsmen cr ON cr.area_id = a.id
        GROUP BY a.name
      ) sub
    )
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_breakdown_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_breakdown_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_breakdown_counts() TO authenticated;

COMMIT;
