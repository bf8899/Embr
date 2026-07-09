-- Creator early-access requests + channel-ownership verification. A creator
-- submits their channel; we hand back a one-time code to place in their bio;
-- the code proves they control the channel. Admins verify (auto-check or by eye)
-- and approve — approval mints a single-use beta invite code to onboard them.

create table public.creator_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  platform text not null,
  channel_url text not null,
  follower_count integer,
  about text,
  verification_code text not null,
  verified boolean not null default false,
  verified_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  invite_code text,
  created_at timestamptz not null default now()
);

create index creator_requests_status_idx on public.creator_requests (status, created_at desc);

alter table public.creator_requests enable row level security;

-- Only admins read the queue; submissions/mutations go through definer fns.
create policy "Admins read creator requests"
  on public.creator_requests for select
  using (public.current_user_is_admin());

-- Public submission. Validates, dedupes by email (returns the existing code so a
-- creator can retrieve their instructions), and returns the verification code.
create function public.submit_creator_request(
  p_name text,
  p_email text,
  p_platform text,
  p_channel_url text,
  p_follower_count integer,
  p_about text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_code text; v_existing text;
begin
  if length(trim(coalesce(p_name, ''))) < 2
     or coalesce(p_email, '') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     or length(trim(coalesce(p_channel_url, ''))) < 6
     or coalesce(p_platform, '') = '' then
    raise exception 'invalid input';
  end if;

  select verification_code into v_existing
  from public.creator_requests
  where lower(email) = lower(trim(p_email)) and status = 'pending'
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  v_code := 'ember-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);

  insert into public.creator_requests
    (name, email, platform, channel_url, follower_count, about, verification_code)
  values (
    left(trim(p_name), 120),
    lower(trim(p_email)),
    left(p_platform, 40),
    left(trim(p_channel_url), 400),
    greatest(0, coalesce(p_follower_count, 0)),
    left(coalesce(p_about, ''), 1000),
    v_code
  );

  return v_code;
end;
$$;

grant execute on function public.submit_creator_request(text, text, text, text, integer, text)
  to anon, authenticated;

-- Admin: set the verified flag (from an auto-check or by eye).
create function public.admin_set_creator_verified(p_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  update public.creator_requests
  set verified = p_verified, verified_at = case when p_verified then now() else null end
  where id = p_id;
end;
$$;

-- Admin: approve (mints a single-use invite code) or reject a request.
create function public.admin_review_creator(p_id uuid, p_status text, p_note text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_email text; v_invite text;
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_status not in ('approved', 'rejected') then raise exception 'invalid status'; end if;

  select email into v_email from public.creator_requests where id = p_id;
  if v_email is null then raise exception 'request not found'; end if;

  if p_status = 'approved' then
    v_invite := 'CREATOR-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    insert into public.beta_invite_codes (code, note, max_uses, created_by)
      values (v_invite, 'Creator: ' || v_email, 1, auth.uid());
  end if;

  update public.creator_requests
  set status = p_status,
      review_note = p_note,
      invite_code = coalesce(v_invite, invite_code),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_id;

  return v_invite;
end;
$$;
