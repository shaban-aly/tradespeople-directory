-- ============================================================================
-- 0007_craftsman_events_stats_hardening.sql — المرحلة 4: تحصين events + stats
-- ----------------------------------------------------------------------------
-- يصلّح فجوات المراجعة الحيَة:
--   1) record_craftsman_event (SECURITY DEFINER ب EXECUTE عام مقصود) يُحصَّن
--      داخلياً: حدود أطوال مطابقة لقيد الـ route (slug/device/session/path)
--      + تحقق pattern + رفض القيم الفارغة — فلا تمر مدخلات ضخمة عبر RPC عام.
--   2) craftsman_stats craftsman read own: إزالة auth.role() (مخالفة للقاعدة) —
--      الاعتماد على get_my_craftsman_id() وحده (يُرجع NULL لغير الفني).
--   3) سياسة admin all جديدة على craftsman_stats وcraftsman_events (لم تكن
--      موجودة رغم أن مصفوفة الأدوار تفرض admin=الكل).
--   4) فهرس الأداء لقراءات analytics على craftsman_events.
-- بلا أي تغيير في البيانات القائمة أو توقيع الدالة.
-- ============================================================================

BEGIN;

-- 1) تحصين record_craftsman_event: حدود أطوال + pattern داخل الدالة
CREATE OR REPLACE FUNCTION public.record_craftsman_event(p_slug text, p_metric text, p_device_key text, p_session_id text, p_path text DEFAULT ''::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_craftsman_id uuid;
  v_event_type   text;
begin
  -- حدود أطوال وتحقق pattern (تطابق قيد الـ route لمنع مدخلات ضخمة عبر RPC عام)
  if p_slug is null
     or length(p_slug) = 0
     or length(p_slug) > 60
     or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    return false;
  end if;

  if p_metric = 'view' then
    v_event_type := 'page_view';
  elsif p_metric = 'call' then
    v_event_type := 'call_click';
  elsif p_metric = 'whatsapp' then
    v_event_type := 'whatsapp_click';
  else
    return false;
  end if;

  if p_device_key is null or length(p_device_key) = 0 or length(p_device_key) > 200 then
    return false;
  end if;

  if p_session_id is null or length(p_session_id) = 0 or length(p_session_id) > 64 then
    return false;
  end if;

  if p_path is null or length(p_path) > 200 then
    return false;
  end if;

  select id into v_craftsman_id
  from public.craftsmen
  where slug = p_slug and is_published = true;

  if v_craftsman_id is null then
    return false;
  end if;

  insert into public.craftsman_events (event_type, craftsman_id, device_key, session_id, path)
  values (v_event_type, v_craftsman_id, p_device_key, p_session_id, p_path);

  insert into public.craftsman_stats (craftsman_id, views, calls, whatsapp)
  values (
    v_craftsman_id,
    case when p_metric = 'view' then 1 else 0 end,
    case when p_metric = 'call' then 1 else 0 end,
    case when p_metric = 'whatsapp' then 1 else 0 end
  )
  on conflict (craftsman_id) do update set
    views    = case when p_metric = 'view' then public.craftsman_stats.views + 1 else public.craftsman_stats.views end,
    calls    = case when p_metric = 'call' then public.craftsman_stats.calls + 1 else public.craftsman_stats.calls end,
    whatsapp = case when p_metric = 'whatsapp' then public.craftsman_stats.whatsapp + 1 else public.craftsman_stats.whatsapp end,
    updated_at = now();

  return true;
end;
$function$;

-- 2) craftsman_stats: سياسة الفني بلا auth.role() + إضافة admin all
DROP POLICY IF EXISTS "craftsman_stats craftsman read own" ON public.craftsman_stats;
CREATE POLICY "craftsman_stats craftsman read own"
  ON public.craftsman_stats FOR SELECT
  TO authenticated
  USING (craftsman_id = (SELECT public.get_my_craftsman_id()));

DROP POLICY IF EXISTS "craftsman_stats admin all" ON public.craftsman_stats;
CREATE POLICY "craftsman_stats admin all"
  ON public.craftsman_stats FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 3) craftsman_events: إضافة admin all (كان الجدول بلا أي سياسات رغم RLS)
DROP POLICY IF EXISTS "craftsman_events admin all" ON public.craftsman_events;
CREATE POLICY "craftsman_events admin all"
  ON public.craftsman_events FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 4) فهرس أداء قراءات analytics (تصفية created_at + event_type)
CREATE INDEX IF NOT EXISTS craftsman_events_analytics_idx
  ON public.craftsman_events (event_type, created_at DESC);

COMMIT;