-- Event tracking: the foundation for real active-user, session, retention, and
-- geography metrics that aren't derivable from the existing tables. First-party
-- and coarse by design — we store user_id (if logged in), a client session id,
-- event type, path, and a 2-letter country (from Vercel's edge IP headers, set
-- server-side). No raw IP, no city. "Active user" downstream = the identity
-- coalesce(user_id, 'anon:'||session_id), so anonymous visitors count too.

create table public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  session_id text not null,
  event_type text not null,
  path text,
  country text,
  region text,
  created_at timestamptz not null default now()
);

create index analytics_events_created_idx on public.analytics_events (created_at);
create index analytics_events_session_idx on public.analytics_events (session_id, created_at);
create index analytics_events_user_idx on public.analytics_events (user_id, created_at);

-- RLS on with no policies: the table is only ever touched by the definer
-- functions below (ingestion + admin-gated reads), never directly by clients.
alter table public.analytics_events enable row level security;

-- ————— ingestion —————
-- Anon + authenticated callable. user_id comes from auth.uid() (server-verified,
-- never client-supplied); country/region are passed by the route handler from
-- trusted edge headers. Inputs are length-capped and the event type allow-listed
-- so this can't be used to write arbitrary rows.
create function public.track_event(
  p_session_id text,
  p_event_type text,
  p_path text default null,
  p_country text default null,
  p_region text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_session_id is null or length(p_session_id) not between 8 and 64 then return; end if;
  if p_event_type not in ('pageview', 'heartbeat') then return; end if;

  insert into public.analytics_events (user_id, session_id, event_type, path, country, region)
  values (
    auth.uid(),
    p_session_id,
    p_event_type,
    left(p_path, 200),
    left(nullif(p_country, ''), 8),
    left(nullif(p_region, ''), 64)
  );
end;
$$;

grant execute on function public.track_event(text, text, text, text, text) to anon, authenticated;

-- ————— admin-gated reads —————
create function public.active_users_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare r jsonb;
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;

  with ev as (
    select coalesce(user_id::text, 'anon:' || session_id) as aid, session_id, created_at
    from public.analytics_events
  ),
  first_seen as (
    select aid, min(created_at) as first_at from ev group by aid
  ),
  active30 as (
    select distinct aid from ev where created_at > now() - interval '30 days'
  ),
  sessions30 as (
    select session_id, max(created_at) - min(created_at) as dur
    from public.analytics_events
    where created_at > now() - interval '30 days'
    group by session_id
    having count(*) > 1
  )
  select jsonb_build_object(
    'dau', (select count(distinct aid) from ev where created_at > now() - interval '1 day'),
    'wau', (select count(distinct aid) from ev where created_at > now() - interval '7 days'),
    'mau', (select count(distinct aid) from ev where created_at > now() - interval '30 days'),
    'avg_session_minutes',
      (select coalesce(round(avg(extract(epoch from dur)) / 60)::int, 0) from sessions30),
    'active_30d', (select count(*) from active30),
    'new_30d',
      (select count(*) from active30 a join first_seen f on f.aid = a.aid
        where f.first_at > now() - interval '30 days'),
    'returning_30d',
      (select count(*) from active30 a join first_seen f on f.aid = a.aid
        where f.first_at <= now() - interval '30 days')
  ) into r;

  return r;
end;
$$;

create function public.dau_series(p_days integer default 30)
returns table (day date, actives integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_days < 1 or p_days > 90 then p_days := 30; end if;

  return query
  with days as (
    select generate_series(
      date_trunc('day', now()) - ((p_days - 1) || ' days')::interval,
      date_trunc('day', now()),
      '1 day'::interval
    ) as d
  )
  select
    d.d::date,
    (select count(distinct coalesce(e.user_id::text, 'anon:' || e.session_id))
     from public.analytics_events e
     where date_trunc('day', e.created_at) = d.d)::integer
  from days d
  order by d.d;
end;
$$;

create function public.geo_breakdown(p_days integer default 30)
returns table (country text, actives integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_days < 1 or p_days > 90 then p_days := 30; end if;

  return query
  select
    coalesce(nullif(e.country, ''), 'Unknown') as country,
    count(distinct coalesce(e.user_id::text, 'anon:' || e.session_id))::integer as actives
  from public.analytics_events e
  where e.created_at > now() - (p_days || ' days')::interval
  group by coalesce(nullif(e.country, ''), 'Unknown')
  order by actives desc
  limit 8;
end;
$$;
