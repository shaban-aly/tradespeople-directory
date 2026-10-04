BEGIN;

-- 1. Fix get_admin_users to read craftsman info from craftsmen table via lateral join
DROP FUNCTION IF EXISTS public.get_admin_users();
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id uuid,
  display_name text,
  email text,
  avatar_url text,
  role text,
  craftsman_id uuid,
  craftsman_name text,
  craftsman_slug text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'غير مصرح لك بالوصول إلى بيانات المستخدمين';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    u.email::text,
    p.avatar_url,
    p.role,
    c.id AS craftsman_id,
    c.name AS craftsman_name,
    c.slug AS craftsman_slug,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN LATERAL (
    SELECT id, name, slug
    FROM public.craftsmen
    WHERE owner_user_id = p.id
    ORDER BY created_at DESC
    LIMIT 1
  ) c ON true
  ORDER BY p.created_at DESC;
END;
$$;

-- 2. Fix notify_review_added to read owner_user_id from craftsmen table
CREATE OR REPLACE FUNCTION public.notify_review_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_user_id INTO v_owner FROM public.craftsmen WHERE id = NEW.craftsman_id LIMIT 1;
  IF v_owner IS NOT NULL AND v_owner IS DISTINCT FROM NEW.user_id THEN
    PERFORM public.create_notification(
      v_owner,
      'review_added',
      'واحد قيّم شغلك ⭐',
      COALESCE(NEW.user_name, 'عميل') || ' قيّم بروفايلك ' ||
        NEW.rating::text || ' من 5 نجوم.',
      jsonb_build_object('craftsman_id', NEW.craftsman_id, 'review_id', NEW.id, 'rating', NEW.rating),
      'review:' || NEW.id::text
    );
  END IF;
  RETURN NULL;
END;
$$;

-- 3. Fix increment_craftsman_stats to read owner_user_id directly from craftsmen table
CREATE OR REPLACE FUNCTION public.increment_craftsman_stats(
  p_slug text,
  p_action text,
  p_ip text DEFAULT NULL::text,
  p_user_id uuid DEFAULT NULL::uuid,
  p_user_status text DEFAULT 'anonymous'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  select id, owner_user_id into v_craftsman_id, v_craftsman_owner_id
  from public.craftsmen
  where slug = p_slug and is_published = true;

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
$$;

COMMIT;
