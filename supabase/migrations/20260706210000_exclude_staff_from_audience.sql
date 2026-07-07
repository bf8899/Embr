-- Exclude staff (is_admin) from advertiser-facing audience numbers. Staff browse
-- the site (esp. the admin dashboards) and would otherwise inflate audience size
-- and active-user metrics. Scope: audience composition + all active-user/session/
-- geo metrics. Content-performance (engagement totals, top videos/creators) is
-- left as-is — it measures real activity regardless of who produced it.
--
-- Anonymous events (user_id null) are kept: we can't attribute them, and a
-- logged-out visitor is a genuine visitor.

create or replace function public.advertiser_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare r jsonb;
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;

  select jsonb_build_object(
    'audience', jsonb_build_object(
      'total',       (select count(*) from public.profiles where not is_admin),
      'viewers',     (select count(*) from public.profiles where role = 'viewer' and not is_admin),
      'creators',    (select count(*) from public.profiles where role = 'creator' and not is_admin),
      'both',        (select count(*) from public.profiles where role = 'both' and not is_admin),
      'signups_7d',  (select count(*) from public.profiles where not is_admin and created_at > now() - interval '7 days'),
      'signups_30d', (select count(*) from public.profiles where not is_admin and created_at > now() - interval '30 days')
    ),
    'engagement', jsonb_build_object(
      'views',        (select coalesce(sum(view_count), 0) from public.videos),
      'likes',        (select count(*) from public.likes),
      'comments',     (select count(*) from public.comments),
      'tips',         (select count(*) from public.tips),
      'follows',      (select count(*) from public.follows),
      'embers',       (select coalesce(sum(amount), 0) from public.tips),
      'watch_minutes',(select coalesce(round(sum(view_count::numeric * coalesce(duration_seconds, 0)) / 60), 0) from public.videos),
      'live_videos',  (select count(*) from public.videos where status = 'live')
    ),
    'top_videos', coalesce((
      select jsonb_agg(v) from (
        select vi.id, vi.title, pr.handle,
               vi.view_count as views, vi.like_count as likes, vi.ember_count as embers
        from public.videos vi
        join public.profiles pr on pr.id = vi.creator_id
        where vi.status <> 'removed'
        order by vi.view_count desc, vi.like_count desc
        limit 8
      ) v
    ), '[]'::jsonb),
    'top_creators', coalesce((
      select jsonb_agg(c) from (
        select pr.id, pr.handle, pr.display_name,
               (select count(*) from public.follows f where f.creator_id = pr.id) as followers,
               coalesce(sum(vi.view_count), 0) as views,
               coalesce(sum(vi.ember_count), 0) as embers,
               count(vi.id) as videos
        from public.profiles pr
        join public.videos vi on vi.creator_id = pr.id and vi.status <> 'removed'
        group by pr.id, pr.handle, pr.display_name
        order by views desc, followers desc
        limit 8
      ) c
    ), '[]'::jsonb)
  ) into r;

  return r;
end;
$$;

-- Shared staff-exclusion predicate, inlined below: keep an event unless it was
-- authored by a known admin.
create or replace function public.active_users_summary()
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
    select coalesce(e.user_id::text, 'anon:' || e.session_id) as aid, e.session_id, e.created_at
    from public.analytics_events e
    where not exists (select 1 from public.profiles p where p.id = e.user_id and p.is_admin)
  ),
  first_seen as (
    select aid, min(created_at) as first_at from ev group by aid
  ),
  active30 as (
    select distinct aid from ev where created_at > now() - interval '30 days'
  ),
  sessions30 as (
    select e.session_id, max(e.created_at) - min(e.created_at) as dur
    from public.analytics_events e
    where e.created_at > now() - interval '30 days'
      and not exists (select 1 from public.profiles p where p.id = e.user_id and p.is_admin)
    group by e.session_id
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

create or replace function public.dau_series(p_days integer default 30)
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
     where date_trunc('day', e.created_at) = d.d
       and not exists (select 1 from public.profiles p where p.id = e.user_id and p.is_admin))::integer
  from days d
  order by d.d;
end;
$$;

create or replace function public.geo_breakdown(p_days integer default 30)
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
    and not exists (select 1 from public.profiles p where p.id = e.user_id and p.is_admin)
  group by coalesce(nullif(e.country, ''), 'Unknown')
  order by actives desc
  limit 8;
end;
$$;
