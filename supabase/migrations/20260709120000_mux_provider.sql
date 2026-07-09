-- Swap the interim Supabase Storage video stub for Mux. Mux ingests
-- asynchronously: at upload time we only know the direct-upload id; the asset
-- id + playback id + duration + thumbnail arrive later via the asset.ready
-- webhook. So videos stay 'processing' until the webhook flips them 'live'.
--
-- Existing storage videos (incl. the demo seed) keep playing: `provider`
-- defaults to 'storage', and playback branches on it. New uploads set 'mux'.

alter table public.videos
  add column provider text not null default 'storage',
  add column mux_upload_id text,
  add column playback_id text;

-- Mux inserts have no asset ref until the webhook, so the column can't be
-- NOT NULL anymore. (Storage rows still populate it at insert.)
alter table public.videos
  alter column video_asset_id drop not null;

-- The webhook correlates an incoming asset back to our row by the upload id.
create unique index videos_mux_upload_id_idx
  on public.videos (mux_upload_id)
  where mux_upload_id is not null;

comment on column public.videos.provider is
  'storage | mux — which backend hosts this video, drives playback + upload paths';
comment on column public.videos.mux_upload_id is
  'Mux direct-upload id; correlates the asset.ready webhook back to this row';
comment on column public.videos.playback_id is
  'Mux public playback id; feeds stream.mux.com / image.mux.com URLs';
