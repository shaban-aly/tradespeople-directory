-- 0031_ignore_craftsman_self_stats.sql
-- منع احتساب مشاهدات أو نقرات (واتساب/اتصال) للصنايعي على صفحته الخاصة

BEGIN;

CREATE OR REPLACE FUNCTION public.increment_craftsman_stats(
  p_slug        text,
  p_action      text,
  p_ip          text DEFAULT '0.0.0.0'::text,
  p_user_id     uuid DEFAULT NULL::uuid,
  p_user_status text DEFAULT 'anonymous'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_craftsman_id       uuid;
  v_craftsman_owner_id uuid;
  v_rl                 jsonb;
  v_status_clean       text;
begin
  if p_slug is null
     or length(p_slug) = 0
     or length(p_slug) > 90
     or p_slug !~ '^[a-z0-9\u0621-\u064A\u0660-\u0669]+(?:-[a-z0-9\u0621-\u064A\u0660-\u0669]+)*$' then
    return false;
  end if;

  if p_action is null or p_action not in ('view', 'call', 'whatsapp') then
    return false;
  end if;

  v_status_clean := case 
    when p_user_status in ('authenticated', 'anonymous') then p_user_status 
    else 'anonymous' 
  end;

  select public.rate_limit_consume(
    'stats:rpc:' || coalesce(p_ip, '0.0.0.0') || ':' || p_slug,
    120,
    60
  ) into v_rl;

  if not coalesce((v_rl->>'allowed')::boolean, false) then
    return false;
  end if;

  select c.id, p.id into v_craftsman_id, v_craftsman_owner_id
  from public.craftsmen c
  left join public.profiles p on p.craftsman_id = c.id
  where c.slug = p_slug and c.is_published = true;

  if v_craftsman_id is null then
    return false;
  end if;

  -- إذا كان المستخدم الحالي هو نفسه صاحب البروفايل، نتجاهل الحدث ولا نسجله (ونعيد true لنجاح العملية ظاهرياً)
  if p_user_id is not null and p_user_id = v_craftsman_owner_id then
    return true;
  end if;

  insert into public.craftsman_stats (craftsman_id, views, calls, whatsapp)
  values (
    v_craftsman_id,
    case when p_action = 'view' then 1 else 0 end,
    case when p_action = 'call' then 1 else 0 end,
    case when p_action = 'whatsapp' then 1 else 0 end
  )
  on conflict (craftsman_id) do update set
    views      = case when p_action = 'view' then public.craftsman_stats.views + 1 else public.craftsman_stats.views end,
    calls      = case when p_action = 'call' then public.craftsman_stats.calls + 1 else public.craftsman_stats.calls end,
    whatsapp   = case when p_action = 'whatsapp' then public.craftsman_stats.whatsapp + 1 else public.craftsman_stats.whatsapp end,
    updated_at = now();

  insert into public.craftsman_stats_daily (craftsman_id, day, views, calls, whatsapp)
  values (
    v_craftsman_id,
    current_date,
    case when p_action = 'view' then 1 else 0 end,
    case when p_action = 'call' then 1 else 0 end,
    case when p_action = 'whatsapp' then 1 else 0 end
  )
  on conflict (craftsman_id, day) do update set
    views    = public.craftsman_stats_daily.views + excluded.views,
    calls    = public.craftsman_stats_daily.calls + excluded.calls,
    whatsapp = public.craftsman_stats_daily.whatsapp + excluded.whatsapp;

  if p_action in ('call', 'whatsapp') then
    insert into public.interaction_logs (
      craftsman_id,
      contact_method,
      user_id,
      user_status
    ) values (
      v_craftsman_id,
      case when p_action = 'call' then 'phone' else 'whatsapp' end,
      p_user_id,
      v_status_clean
    );
  end if;

  return true;
end;
$function$;

REVOKE ALL ON FUNCTION public.increment_craftsman_stats(text, text, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_craftsman_stats(text, text, text, uuid, text) TO anon, authenticated;

COMMIT;
