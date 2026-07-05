-- Phase D: non-monetary tipping ledger + demo wallet.
-- Embers are play tokens (is_demo_currency always true here) — see the build
-- plan's scope-limits section. Everyone gets a starting demo grant; tipping
-- moves embers from sender to recipient atomically, and a share of the demo
-- economy is that received embers refill your own spendable balance.

-- Spendable demo balance. Existing rows (and the two test accounts) pick up the
-- grant via the default. New signups inherit it through the profiles insert.
alter table public.profiles
  add column ember_balance integer not null default 500;

-- ————— tips ledger —————
-- Kept as a real ledger from day one (build plan §2) so flipping to real
-- currency later is a data migration, not a rebuild. video_id is always
-- populated for now (a comment carries its video), but stays nullable to leave
-- room for future non-video tip targets.
create table public.tips (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid references public.videos (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  amount integer not null check (amount > 0),
  is_demo_currency boolean not null default true,
  created_at timestamptz not null default now(),
  constraint no_self_tip check (sender_id <> recipient_id)
);

create index tips_video_id_idx on public.tips (video_id);
create index tips_comment_id_idx on public.tips (comment_id) where comment_id is not null;
create index tips_recipient_id_idx on public.tips (recipient_id);

alter table public.tips enable row level security;

-- Ledger is public so leaderboards and per-comment totals render for everyone.
create policy "Tips are viewable by everyone"
  on public.tips for select
  using (true);

-- No insert/update/delete policies: every write goes through send_tip(), which
-- enforces the balance check and moves both sides atomically. RLS blocks any
-- direct client insert (which could otherwise fake a recipient or amount).

-- send_tip: the only way to record a tip. Derives the recipient from the target
-- (never trusts a client-supplied recipient), checks and debits the sender,
-- credits the recipient, and — for direct video tips only — warms the video's
-- ember bar. Runs as definer because a viewer can't update videos or another
-- profile under RLS. Returns the sender's new balance for optimistic UI.
create function public.send_tip(
  p_amount integer,
  p_video_id uuid default null,
  p_comment_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender uuid := auth.uid();
  v_recipient uuid;
  v_video_id uuid;
  v_is_comment boolean := p_comment_id is not null;
  v_balance integer;
begin
  if v_sender is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(p_amount, 0) <= 0 then
    raise exception 'invalid amount';
  end if;

  if v_is_comment then
    select c.user_id, c.video_id into v_recipient, v_video_id
    from public.comments c
    where c.id = p_comment_id;
  elsif p_video_id is not null then
    select v.creator_id, v.id into v_recipient, v_video_id
    from public.videos v
    where v.id = p_video_id and v.status = 'live';
  else
    raise exception 'tip must target a video or a comment';
  end if;

  if v_recipient is null then
    raise exception 'tip target not found';
  end if;
  if v_recipient = v_sender then
    raise exception 'cannot tip yourself';
  end if;

  -- Lock the sender row so concurrent tips can't overspend the balance.
  select ember_balance into v_balance
  from public.profiles
  where id = v_sender
  for update;

  if v_balance < p_amount then
    raise exception 'insufficient balance';
  end if;

  insert into public.tips (sender_id, recipient_id, video_id, comment_id, amount)
  values (v_sender, v_recipient, v_video_id, p_comment_id, p_amount);

  update public.profiles set ember_balance = ember_balance - p_amount where id = v_sender;
  update public.profiles set ember_balance = ember_balance + p_amount where id = v_recipient;

  if not v_is_comment then
    update public.videos set ember_count = ember_count + p_amount where id = v_video_id;
  end if;

  return v_balance - p_amount;
end;
$$;

-- Per-video leaderboard: top tippers of the video itself (comment tips excluded,
-- since those reward the commenter, not the creator). Invoker rights are enough
-- — tips and profiles are both publicly selectable.
create function public.video_tip_leaderboard(p_video_id uuid, p_limit integer default 5)
returns table (sender_id uuid, handle text, display_name text, total bigint)
language sql
stable
set search_path = ''
as $$
  select t.sender_id, p.handle, p.display_name, sum(t.amount)::bigint as total
  from public.tips t
  join public.profiles p on p.id = t.sender_id
  where t.video_id = p_video_id and t.comment_id is null
  group by t.sender_id, p.handle, p.display_name
  order by total desc, min(t.created_at) asc
  limit p_limit;
$$;
