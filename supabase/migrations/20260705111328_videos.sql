-- Phase B: videos table (build-plan data model) + storage bucket for the
-- interim Supabase Storage provider. video_asset_id holds the storage object
-- path for now; it becomes the Mux/Cloudflare asset ref when a real
-- transcoding provider is swapped in.

create type public.video_status as enum ('processing', 'live', 'removed');

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  video_asset_id text not null,
  thumbnail_url text,
  duration_seconds integer,
  status public.video_status not null default 'processing',
  tags text[] not null default '{}',
  view_count integer not null default 0,
  ember_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index videos_creator_id_idx on public.videos (creator_id);
create index videos_status_created_idx on public.videos (status, created_at desc);

alter table public.videos enable row level security;

create policy "Live videos are viewable by everyone"
  on public.videos for select
  using (status = 'live' or creator_id = auth.uid());

create policy "Creators can insert their own videos"
  on public.videos for insert
  with check (
    creator_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('creator', 'both')
    )
  );

create policy "Creators can update their own videos"
  on public.videos for update
  using (creator_id = auth.uid());

create policy "Creators can delete their own videos"
  on public.videos for delete
  using (creator_id = auth.uid());

-- Viewers can't update rows they don't own, so view counting goes through a
-- definer function scoped to live videos only.
create function public.increment_view_count(video_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.videos
  set view_count = view_count + 1
  where id = video_id and status = 'live';
$$;

-- Public bucket: playback reads via public URL. 50 MB cap matches the
-- Supabase free-tier upload limit. Image types allowed for thumbnails.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
);

create policy "Video objects are publicly readable"
  on storage.objects for select
  using (bucket_id = 'videos');

create policy "Creators upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Creators can delete their own objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
