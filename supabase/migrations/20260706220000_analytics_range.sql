-- Make the active-audience window selectable (7/30/90 days). DAU/WAU/MAU stay
-- fixed by definition (1/7/30d); the range scopes the "active / new / returning /
-- avg session" figures. dau_series and geo_breakdown already take p_days, so only
-- active_users_summary needs a parameter — drop + recreate to add it (a defaulted
-- arg would otherwise leave the old 0-arg overload ambiguous). Staff exclusion is
-- preserved.

drop function public.active_users_summary();

create function public.active_users_summary(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare r jsonb;
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_days < 1 or p_days > 90 then p_days := 30; end if;

  with ev as (
    select coalesce(e.user_id::text, 'anon:' || e.session_id) as aid, e.session_id, e.created_at
    from public.analytics_events e
    where not exists (select 1 from public.profiles p where p.id = e.user_id and p.is_admin)
  ),
  first_seen as (
    select aid, min(created_at) as first_at from ev group by aid
  ),
  active_range as (
    select distinct aid from ev where created_at > now() - (p_days || ' days')::interval
  ),
  sessions_range as (
    select e.session_id, max(e.created_at) - min(e.created_at) as dur
    from public.analytics_events e
    where e.created_at > now() - (p_days || ' days')::interval
      and not exists (select 1 from public.profiles p where p.id = e.user_id and p.is_admin)
    group by e.session_id
    having count(*) > 1
  )
  select jsonb_build_object(
    'dau', (select count(distinct aid) from ev where created_at > now() - interval '1 day'),
    'wau', (select count(distinct aid) from ev where created_at > now() - interval '7 days'),
    'mau', (select count(distinct aid) from ev where created_at > now() - interval '30 days'),
    'avg_session_minutes',
      (select coalesce(round(avg(extract(epoch from dur)) / 60)::int, 0) from sessions_range),
    'active_range', (select count(*) from active_range),
    'new_range',
      (select count(*) from active_range a join first_seen f on f.aid = a.aid
        where f.first_at > now() - (p_days || ' days')::interval),
    'returning_range',
      (select count(*) from active_range a join first_seen f on f.aid = a.aid
        where f.first_at <= now() - (p_days || ' days')::interval)
  ) into r;

  return r;
end;
$$;
