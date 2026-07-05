-- Phase C: social layer (comments, likes, follows) per the build-plan data model.
-- like_count is denormalized onto videos via trigger since it renders on every
-- tile; follower/comment counts are computed on demand (cold paths).

-- ————— likes —————
create table public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index likes_video_id_idx on public.likes (video_id);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.likes for select
  using (true);

create policy "Users can like as themselves"
  on public.likes for insert
  with check (user_id = auth.uid());

create policy "Users can remove their own likes"
  on public.likes for delete
  using (user_id = auth.uid());

alter table public.videos
  add column like_count integer not null default 0;

create function public.sync_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.videos set like_count = like_count + 1 where id = new.video_id;
  elsif tg_op = 'DELETE' then
    update public.videos set like_count = like_count - 1 where id = old.video_id;
  end if;
  return null;
end;
$$;

create trigger likes_sync_count
  after insert or delete on public.likes
  for each row execute function public.sync_like_count();

-- ————— follows —————
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id),
  constraint no_self_follow check (follower_id <> creator_id)
);

create index follows_creator_id_idx on public.follows (creator_id);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

create policy "Users can follow as themselves"
  on public.follows for insert
  with check (follower_id = auth.uid());

create policy "Users can unfollow themselves"
  on public.follows for delete
  using (follower_id = auth.uid());

-- ————— comments —————
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index comments_video_id_created_idx on public.comments (video_id, created_at desc);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Users can comment as themselves"
  on public.comments for insert
  with check (user_id = auth.uid());

create policy "Users can delete their own comments"
  on public.comments for delete
  using (user_id = auth.uid());
