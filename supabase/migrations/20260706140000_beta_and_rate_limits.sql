-- Phase G / 6b: closed-beta invite-code gate + rate limiting on comments & tips.
-- Additive. beta_mode defaults off so existing open signups keep working until
-- the owner deliberately starts the closed beta.

-- ————— closed-beta invite codes —————
alter table public.platform_settings
  add column beta_mode boolean not null default false;

create table public.beta_invite_codes (
  code text primary key,
  note text,
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0,
  revoked boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.beta_invite_codes enable row level security;

-- Admins manage codes; anonymous signups only ever touch codes through the
-- definer functions below, never by reading the table.
create policy "Admins read invite codes"
  on public.beta_invite_codes for select
  using (public.current_user_is_admin());
create policy "Admins create invite codes"
  on public.beta_invite_codes for insert
  with check (public.current_user_is_admin() and created_by = auth.uid());
create policy "Admins update invite codes"
  on public.beta_invite_codes for update
  using (public.current_user_is_admin());

-- Read-only pre-check for the signup form (safe for anon: only reveals validity
-- of a code the user already holds).
create function public.invite_code_valid(p_code text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.beta_invite_codes
    where code = p_code and not revoked and used_count < max_uses
  );
$$;

-- Atomically consume one use; returns true if a use was available.
create function public.redeem_invite_code(p_code text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_ok boolean;
begin
  update public.beta_invite_codes
    set used_count = used_count + 1
    where code = p_code and not revoked and used_count < max_uses
    returning true into v_ok;
  return coalesce(v_ok, false);
end; $$;

create function public.admin_set_beta_mode(p_on boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  update public.platform_settings
    set beta_mode = p_on, updated_by = auth.uid(), updated_at = now()
    where id = 1;
end; $$;

-- ————— rate limiting (abuse prevention) —————
-- BEFORE INSERT triggers so every path is covered (comments via the action,
-- tips via send_tip). Definer so the window count sees all rows regardless of
-- the caller's RLS view.
create function public.enforce_comment_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_recent integer;
begin
  select count(*) into v_recent
  from public.comments
  where user_id = new.user_id and created_at > now() - interval '60 seconds';
  if v_recent >= 8 then
    raise exception 'You''re commenting too fast — give it a moment.';
  end if;
  return new;
end; $$;

create trigger comment_rate_limit
  before insert on public.comments
  for each row execute function public.enforce_comment_rate_limit();

create function public.enforce_tip_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_recent integer;
begin
  select count(*) into v_recent
  from public.tips
  where sender_id = new.sender_id and created_at > now() - interval '60 seconds';
  if v_recent >= 30 then
    raise exception 'You''re tipping too fast — give it a moment.';
  end if;
  return new;
end; $$;

create trigger tip_rate_limit
  before insert on public.tips
  for each row execute function public.enforce_tip_rate_limit();

-- ————— basic analytics —————
-- Admin-gated aggregate over ALL rows (definer, so RLS-hidden removed/suspended
-- content is still counted for accurate platform totals).
create function public.platform_analytics()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  select jsonb_build_object(
    'signups_total', (select count(*) from public.profiles),
    'signups_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'uploads_total', (select count(*) from public.videos),
    'uploads_7d', (select count(*) from public.videos where created_at > now() - interval '7 days'),
    'live_videos', (select count(*) from public.videos where status = 'live'),
    'views_total', (select coalesce(sum(view_count), 0) from public.videos),
    'watch_minutes', (select coalesce(round(sum(view_count::numeric * coalesce(duration_seconds, 0)) / 60), 0) from public.videos),
    'tips_count', (select count(*) from public.tips),
    'embers_sent', (select coalesce(sum(amount), 0) from public.tips),
    'comments_total', (select count(*) from public.comments)
  ) into r;
  return r;
end; $$;
