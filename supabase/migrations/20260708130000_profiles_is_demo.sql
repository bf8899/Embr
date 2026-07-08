-- Mark seeded demo accounts so they're identifiable/removable, and keep the
-- advertiser analytics honest: demo accounts, their videos, and their tips are
-- excluded from the advertiser dashboard (like staff), while STILL appearing on
-- the public leaderboard (which is a deliberately-seeded showcase).

alter table public.profiles
  add column is_demo boolean not null default false;

-- Recreate advertiser_analytics with is_demo excluded everywhere real numbers
-- are reported (audience, engagement, top content). Staff (is_admin) exclusion
-- from Phase-analytics is preserved.
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
      'total',       (select count(*) from public.profiles where not is_admin and not is_demo),
      'viewers',     (select count(*) from public.profiles where role = 'viewer' and not is_admin and not is_demo),
      'creators',    (select count(*) from public.profiles where role = 'creator' and not is_admin and not is_demo),
      'both',        (select count(*) from public.profiles where role = 'both' and not is_admin and not is_demo),
      'signups_7d',  (select count(*) from public.profiles where not is_admin and not is_demo and created_at > now() - interval '7 days'),
      'signups_30d', (select count(*) from public.profiles where not is_admin and not is_demo and created_at > now() - interval '30 days')
    ),
    'engagement', jsonb_build_object(
      'views', (select coalesce(sum(vi.view_count), 0) from public.videos vi
                join public.profiles p on p.id = vi.creator_id where not p.is_demo),
      'likes', (select count(*) from public.likes l
                where not exists (select 1 from public.profiles p where p.id = l.user_id and p.is_demo)),
      'comments', (select count(*) from public.comments c
                   where not exists (select 1 from public.profiles p where p.id = c.user_id and p.is_demo)),
      'tips', (select count(*) from public.tips t
               where not exists (select 1 from public.profiles p
                 where (p.id = t.sender_id or p.id = t.recipient_id) and p.is_demo)),
      'follows', (select count(*) from public.follows f
                  where not exists (select 1 from public.profiles p where p.id = f.follower_id and p.is_demo)),
      'embers', (select coalesce(sum(t.amount), 0) from public.tips t
                 where not exists (select 1 from public.profiles p
                   where (p.id = t.sender_id or p.id = t.recipient_id) and p.is_demo)),
      'watch_minutes', (select coalesce(round(sum(vi.view_count::numeric * coalesce(vi.duration_seconds, 0)) / 60), 0)
                        from public.videos vi join public.profiles p on p.id = vi.creator_id where not p.is_demo),
      'live_videos', (select count(*) from public.videos vi
                      join public.profiles p on p.id = vi.creator_id
                      where vi.status = 'live' and not p.is_demo)
    ),
    'top_videos', coalesce((
      select jsonb_agg(v) from (
        select vi.id, vi.title, pr.handle,
               vi.view_count as views, vi.like_count as likes, vi.ember_count as embers
        from public.videos vi
        join public.profiles pr on pr.id = vi.creator_id
        where vi.status <> 'removed' and not pr.is_demo
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
        where not pr.is_demo
        group by pr.id, pr.handle, pr.display_name
        order by views desc, followers desc
        limit 8
      ) c
    ), '[]'::jsonb)
  ) into r;

  return r;
end;
$$;
