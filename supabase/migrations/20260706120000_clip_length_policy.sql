-- Phase G / 6a: clip-length policy + bootstrap-phase upload gate. Purely
-- additive — new columns with safe defaults and new tables; no existing table,
-- column, or row is touched or backfilled.
--
-- NB: the spec's Section 2 also lists `profiles.is_admin`, but that column
-- already exists (added in Phase F, 20260705170000_moderation.sql) and is
-- already wired into the admin gate, so it is intentionally NOT re-added here.

-- ————— per-creator clip-length override —————
alter table public.profiles
  add column max_clip_seconds integer;  -- null = use the platform default

-- ————— platform settings (singleton) —————
create table public.platform_settings (
  id integer primary key default 1 check (id = 1),  -- one row, ever
  default_clip_seconds integer not null default 60,
  creator_uploads_open boolean not null default false,  -- bootstrap gate (§3)
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id, default_clip_seconds) values (1, 60);

alter table public.platform_settings enable row level security;

-- Readable by everyone (the upload flow and UI need the default cap + gate);
-- writes go only through the admin-gated definer functions below.
create policy "Platform settings are viewable by everyone"
  on public.platform_settings for select
  using (true);

-- ————— clip-length requests —————
create table public.clip_length_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  requested_at timestamptz not null default now(),
  leaderboard_rank_at_request integer,   -- context captured at request time
  cumulative_tips_at_request numeric,     -- context captured at request time
  requested_seconds integer not null check (requested_seconds > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_seconds integer,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  review_note text
);

create index clip_length_requests_status_idx
  on public.clip_length_requests (status, requested_at);
create index clip_length_requests_creator_idx
  on public.clip_length_requests (creator_id);

alter table public.clip_length_requests enable row level security;

create policy "Creators file their own clip-length requests"
  on public.clip_length_requests for insert
  with check (creator_id = auth.uid());

create policy "Creators read their own requests; admins read all"
  on public.clip_length_requests for select
  using (creator_id = auth.uid() or public.current_user_is_admin());
-- Resolution is admin-only, via admin_resolve_clip_request().

-- ————— bootstrap upload gate at the RLS layer —————
-- While creator_uploads_open is false, only admins may insert videos. Backstops
-- the server action; keeps a suspended/role check from Phase F intact.
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
    and (
      coalesce((select is_admin from public.profiles where id = auth.uid()), false)
      or coalesce(
        (select creator_uploads_open from public.platform_settings where id = 1),
        false
      )
    )
  );

-- ————— admin controls (definer, admin-gated) —————
create function public.admin_set_platform_default(p_seconds integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if coalesce(p_seconds, 0) <= 0 then raise exception 'invalid seconds'; end if;
  update public.platform_settings
    set default_clip_seconds = p_seconds, updated_by = auth.uid(), updated_at = now()
    where id = 1;
end; $$;

-- p_seconds null clears the override (revoke back to the platform default).
create function public.admin_set_creator_cap(p_user_id uuid, p_seconds integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_seconds is not null and p_seconds <= 0 then raise exception 'invalid seconds'; end if;
  update public.profiles set max_clip_seconds = p_seconds where id = p_user_id;
end; $$;

create function public.admin_set_uploads_open(p_open boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  update public.platform_settings
    set creator_uploads_open = p_open, updated_by = auth.uid(), updated_at = now()
    where id = 1;
end; $$;

-- Approving writes the granted length onto the creator's override; rejecting
-- just records the decision. Either way the review metadata is logged.
create function public.admin_resolve_clip_request(
  p_request_id uuid,
  p_status text,
  p_approved_seconds integer,
  p_note text
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_creator uuid;
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_status not in ('approved', 'rejected') then raise exception 'invalid status'; end if;
  if p_status = 'approved' and coalesce(p_approved_seconds, 0) <= 0 then
    raise exception 'approved seconds required';
  end if;

  update public.clip_length_requests
    set status = p_status,
        approved_seconds = case when p_status = 'approved' then p_approved_seconds else null end,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        review_note = p_note
    where id = p_request_id and status = 'pending'
    returning creator_id into v_creator;

  if v_creator is null then
    raise exception 'request not found or already reviewed';
  end if;

  if p_status = 'approved' then
    update public.profiles set max_clip_seconds = p_approved_seconds where id = v_creator;
  end if;
end; $$;

-- Context surfaced on a clip-length request: total embers the creator has
-- received, and their rank among all tip recipients (1 = most). "Context only" —
-- reaching any rank never auto-grants anything.
create function public.creator_tip_standing(p_creator uuid)
returns table (cumulative bigint, rank integer)
language sql
stable
set search_path = ''
as $$
  with totals as (
    select recipient_id, sum(amount)::bigint as total
    from public.tips
    group by recipient_id
  )
  select
    coalesce((select total from totals where recipient_id = p_creator), 0) as cumulative,
    (
      select count(*) + 1
      from totals
      where total > coalesce((select total from totals where recipient_id = p_creator), 0)
    )::integer as rank;
$$;
