-- Advertiser-facing analytics: audience, engagement, top content/creators, and
-- a weekly activity time series. Admin-gated + definer so it counts RLS-hidden
-- rows. Honesty notes baked into the shape:
--   * "views" is a cumulative counter (videos.view_count) with no per-view
--     timestamp, so it is a total only — it is deliberately NOT in the weekly
--     time series. The series is built from genuinely timestamped interactions
--     (signups, likes, comments, tips, follows).
--   * watch_minutes is an estimate: sum(view_count * duration) assumes every
--     view watched the whole clip.

create function public.advertiser_analytics()
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
      'total',        (select count(*) from public.profiles),
      'viewers',      (select count(*) from public.profiles where role = 'viewer'),
      'creators',     (select count(*) from public.profiles where role = 'creator'),
      'both',         (select count(*) from public.profiles where role = 'both'),
      'signups_7d',   (select count(*) from public.profiles where created_at > now() - interval '7 days'),
      'signups_30d',  (select count(*) from public.profiles where created_at > now() - interval '30 days')
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

create function public.advertiser_timeseries(p_weeks integer default 12)
returns table (
  week_start date,
  signups integer,
  likes integer,
  comments integer,
  tips integer,
  follows integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_weeks < 1 or p_weeks > 52 then p_weeks := 12; end if;

  return query
  with weeks as (
    select generate_series(
      date_trunc('week', now()) - ((p_weeks - 1) || ' weeks')::interval,
      date_trunc('week', now()),
      '1 week'::interval
    ) as wk
  )
  select
    w.wk::date,
    (select count(*) from public.profiles p where date_trunc('week', p.created_at) = w.wk)::integer,
    (select count(*) from public.likes l   where date_trunc('week', l.created_at) = w.wk)::integer,
    (select count(*) from public.comments c where date_trunc('week', c.created_at) = w.wk)::integer,
    (select count(*) from public.tips t    where date_trunc('week', t.created_at) = w.wk)::integer,
    (select count(*) from public.follows f where date_trunc('week', f.created_at) = w.wk)::integer
  from weeks w
  order by w.wk;
end;
$$;
