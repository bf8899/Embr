-- Global (platform-wide) leaderboards + an admin "send embers" that both grants
-- to the recipient's wallet AND records as earned (so it counts on the board).
-- The tips table has restrictive RLS, so these read via definer functions.
-- The leaderboard readers are public (no admin gate) — they only expose already-
-- public handles/display names plus aggregate totals.

-- Top earners: everyone ranked by embers received (video tips, comment tips, and
-- admin grants all count).
create function public.top_creators_leaderboard(p_limit integer default 20)
returns table (
  id uuid,
  handle text,
  display_name text,
  avatar_url text,
  earned bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.handle, p.display_name, p.avatar_url,
         coalesce(sum(t.amount), 0)::bigint as earned
  from public.tips t
  join public.profiles p on p.id = t.recipient_id
  where not p.suspended
  group by p.id, p.handle, p.display_name, p.avatar_url
  having coalesce(sum(t.amount), 0) > 0
  order by earned desc, p.handle
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

-- Top supporters: ranked by embers sent. Staff/admin senders are excluded so
-- platform grants don't crowd the board.
create function public.top_supporters_leaderboard(p_limit integer default 20)
returns table (
  id uuid,
  handle text,
  display_name text,
  sent bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.handle, p.display_name, coalesce(sum(t.amount), 0)::bigint as sent
  from public.tips t
  join public.profiles p on p.id = t.sender_id
  where not p.is_admin
  group by p.id, p.handle, p.display_name
  having coalesce(sum(t.amount), 0) > 0
  order by sent desc, p.handle
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

grant execute on function public.top_creators_leaderboard(integer) to anon, authenticated;
grant execute on function public.top_supporters_leaderboard(integer) to anon, authenticated;

-- Admin "send embers": a platform gift that lands in the recipient's spendable
-- wallet AND is recorded in the tips ledger as earned (sender = the admin, so it
-- counts toward the recipient's earned total / leaderboard). Does not debit the
-- admin — it's a grant, not a transfer. Admin senders are filtered out of the
-- supporters board above, so this never inflates a staff "sent" total there.
create function public.admin_grant_tip(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_balance integer;
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then raise exception 'invalid amount'; end if;
  if p_user_id = auth.uid() then raise exception 'cannot send embers to yourself'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'user not found';
  end if;

  insert into public.tips (sender_id, recipient_id, amount)
  values (auth.uid(), p_user_id, p_amount);

  update public.profiles
  set ember_balance = ember_balance + p_amount
  where id = p_user_id
  returning ember_balance into v_balance;

  return v_balance;
end;
$$;
