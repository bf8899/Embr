import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { muxPlaybackUrl } from "@/lib/video/mux";

// Video hosting is per-row: `videos.provider` records which backend holds each
// clip, so Mux and the legacy Supabase Storage stub coexist. New uploads go to
// whichever provider VIDEO_PROVIDER selects; old rows keep playing on 'storage'.

export type VideoProviderName = "storage" | "mux";

/** The provider new uploads should use. Defaults to storage until Mux is on. */
export function activeProvider(): VideoProviderName {
  return process.env.VIDEO_PROVIDER === "mux" ? "mux" : "storage";
}

/** A public URL a <video> element (storage) can play from a storage path. */
export function storagePlaybackUrl(
  supabase: SupabaseClient<Database>,
  path: string
): string {
  return supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
}

/** Create a signed one-time upload target for the storage stub. */
export async function createStorageUploadTarget(
  supabase: SupabaseClient<Database>,
  path: string
): Promise<{ url: string; assetId: string }> {
  const { data, error } = await supabase.storage
    .from("videos")
    .createSignedUploadUrl(path);
  if (error) throw error;
  return { url: data.signedUrl, assetId: data.path };
}

/** Minimal shape needed to resolve a video's playable source. */
export type PlayableVideo = {
  provider: string;
  playback_id: string | null;
  video_asset_id: string | null;
};

export type Playback =
  // `src` is an HLS manifest (needs hls.js off Safari); `file` is a direct URL.
  | { kind: "mux"; src: string }
  | { kind: "file"; src: string }
  | { kind: "unavailable" };

/**
 * Resolve a row to how it should play. Mux rows stream HLS via their playback
 * id; storage rows resolve to a public file URL. A Mux row still processing (no
 * playback id yet) is "unavailable" — callers gate on status === 'processing'
 * upstream, this just covers the brief window before the webhook lands.
 */
export function resolvePlayback(
  supabase: SupabaseClient<Database>,
  video: PlayableVideo
): Playback {
  if (video.provider === "mux") {
    return video.playback_id
      ? { kind: "mux", src: muxPlaybackUrl(video.playback_id) }
      : { kind: "unavailable" };
  }
  return video.video_asset_id
    ? { kind: "file", src: storagePlaybackUrl(supabase, video.video_asset_id) }
    : { kind: "unavailable" };
}
