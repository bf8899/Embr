-- Admin user-management tools: a searchable user directory plus admin-gated
-- actions to grant/adjust embers, promote/demote admins, and hard-delete
-- accounts. Suspend/unsuspend already exists (admin_set_suspended, Phase F).
-- All definer + admin-gated, matching the Phase F moderation pattern: these do
-- exactly what RLS forbids for a normal user, so they run as the table owner
-- and check current_user_is_admin() first.

-- ————— user directory —————
-- Definer so it can read auth.users.email and count RLS-hidden rows. Returns
-- everything the admin table needs in one call. Empty/blank search returns the
-- most recent accounts; otherwise matches handle, display name, or email.
create function public.admin_user_directory(p_search text default null)
returns table (
  id uuid,
  handle text,
  display_name text,
  email text,
  role public.profile_role,
  is_admin boolean,
  suspended boolean,
  ember_balance integer,
  created_at timestamptz,
  video_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    p.id, p.handle, p.display_name, u.email::text, p.role, p.is_admin,
    p.suspended, p.ember_balance, p.created_at,
    (select count(*) from public.videos v where v.creator_id = p.id) as video_count
  from public.profiles p
  join auth.users u on u.id = p.id
  where
    p_search is null
    or length(trim(p_search)) = 0
    or p.handle ilike '%' || p_search || '%'
    or p.display_name ilike '%' || p_search || '%'
    or u.email ilike '%' || p_search || '%'
  order by p.created_at desc
  limit 100;
end;
$$;

-- ————— grant / adjust embers —————
-- Sets a user's spendable balance directly (the build plan calls the wallet
-- "admin-adjustable"). Use for grants, resets, or corrections.
create function public.admin_set_ember_balance(p_user_id uuid, p_balance integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_balance is null or p_balance < 0 then raise exception 'invalid balance'; end if;
  update public.profiles set ember_balance = p_balance where id = p_user_id;
  if not found then raise exception 'user not found'; end if;
  return p_balance;
end;
$$;

-- ————— promote / demote admin —————
-- Guards against self-lockout: you can't change your own flag, and the last
-- remaining admin can't be demoted. (The guard_privileged_profile_columns
-- trigger permits this UPDATE because the caller is an admin here.)
create function public.admin_set_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_user_id = auth.uid() then
    raise exception 'change your own admin status from another admin account';
  end if;
  if not p_is_admin
     and (select count(*) from public.profiles where is_admin) <= 1 then
    raise exception 'cannot demote the last admin';
  end if;
  update public.profiles set is_admin = p_is_admin where id = p_user_id;
  if not found then raise exception 'user not found'; end if;
end;
$$;

-- ————— delete account —————
-- Hard delete: removes the auth user, which cascades to the profile and all of
-- their videos/comments/likes/follows/tips/reports (every FK to profiles is ON
-- DELETE CASCADE). Guards: not yourself, and not another admin (demote first) —
-- so an admin can never be deleted out from under themselves.
create function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_user_id = auth.uid() then raise exception 'cannot delete your own account'; end if;
  if (select is_admin from public.profiles where id = p_user_id) then
    raise exception 'demote this admin before deleting the account';
  end if;
  delete from auth.users where id = p_user_id;
  if not found then raise exception 'user not found'; end if;
end;
$$;
