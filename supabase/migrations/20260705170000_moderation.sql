-- Phase F: moderation tooling — reports, an admin review queue, content removal,
-- and soft account suspension. Per the build plan this ships before any public
-- launch. Embers/social stay as-is; this layer sits on top and is enforceable
-- at the RLS level, not just in the UI.

-- ————— privileged profile flags —————
alter table public.profiles
  add column is_admin boolean not null default false,
  add column suspended boolean not null default false;

-- The Phase A "update your own profile" policy would otherwise let a user set
-- their own is_admin/suspended. Revoke column-level UPDATE from the app roles so
-- only the SECURITY DEFINER moderation functions (which run as the table owner)
-- can change them. Other columns stay updatable.
revoke update (is_admin, suspended) on public.profiles from authenticated;
revoke update (is_admin, suspended) on public.profiles from anon;

-- Admin check, used by both RLS policies and the moderation functions. Definer +
-- coalesce so an anonymous / profile-less caller resolves to false, never null.
create function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ————— reports —————
create type public.report_target as enum ('video', 'comment', 'user');
create type public.report_status as enum ('open', 'actioned', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null,
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_status_created_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

-- Anyone signed in can file a report as themselves; only admins can read the
-- queue. Resolution goes through admin_resolve_report (definer), so there are no
-- update/delete policies here.
create policy "Users can file reports as themselves"
  on public.reports for insert
  with check (reporter_id = auth.uid());

create policy "Admins can read the report queue"
  on public.reports for select
  using (public.current_user_is_admin());

-- ————— comment soft-delete —————
-- Soft so the tip ledger stays consistent and removal is reversible.
alter table public.comments
  add column removed boolean not null default false;

drop policy "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable unless removed"
  on public.comments for select
  using (not removed or public.current_user_is_admin());

-- ————— suspension + removal enforcement —————
-- Hide suspended creators' videos from everyone but themselves. (Removed videos
-- were already hidden — they're no longer 'live'.)
drop policy "Live videos are viewable by everyone" on public.videos;
create policy "Live videos are viewable by everyone"
  on public.videos for select
  using (
    (
      status = 'live'
      and not exists (
        select 1 from public.profiles p
        where p.id = videos.creator_id and p.suspended
      )
    )
    or creator_id = auth.uid()
  );

-- Suspended users can't upload.
drop policy "Creators can insert their own videos" on public.videos;
create policy "Creators can insert their own videos"
  on public.videos for insert
  with check (
    creator_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('creator', 'both')
        and not suspended
    )
  );

-- Suspended users can't comment.
drop policy "Users can comment as themselves" on public.comments;
create policy "Users can comment as themselves"
  on public.comments for insert
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.profiles where id = auth.uid() and suspended
    )
  );

-- ————— send_tip: block suspended senders —————
-- Recreated from the Phase D definition with a suspension guard added.
create or replace function public.send_tip(
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
  if exists (select 1 from public.profiles where id = v_sender and suspended) then
    raise exception 'account suspended';
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

-- ————— admin moderation actions —————
-- Each is admin-gated and definer, since moderating other people's content /
-- accounts is exactly what RLS forbids for a normal user.
create function public.admin_remove_video(p_video_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  update public.videos set status = 'removed' where id = p_video_id;
end; $$;

create function public.admin_remove_comment(p_comment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  update public.comments set removed = true where id = p_comment_id;
end; $$;

create function public.admin_set_suspended(p_user_id uuid, p_suspended boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  update public.profiles set suspended = p_suspended where id = p_user_id;
end; $$;

create function public.admin_resolve_report(p_report_id uuid, p_status public.report_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  update public.reports
  set status = p_status, resolved_by = auth.uid(), resolved_at = now()
  where id = p_report_id;
end; $$;
