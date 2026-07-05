import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Isolates provider-specific video hosting behind one module so swapping the
// interim Supabase Storage stub for Mux/Cloudflare Stream only touches this
// file (plus whatever webhook route the real provider needs). The shared
// shape: the server creates an upload destination, the client PUTs the raw
// file to it, and videos.video_asset_id stores the provider's asset ref.

export interface UploadTarget {
  /** Client PUTs the raw file body to this URL. */
  url: string;
  /** Provider asset reference to persist in videos.video_asset_id. */
  assetId: string;
}

export interface VideoProvider {
  name: string;
  /**
   * Create a one-time upload destination. `path` is the desired object path
   * for path-addressed providers (storage stub); Mux-style providers may
   * ignore it and mint their own asset ids.
   */
  createUploadTarget(path: string): Promise<UploadTarget>;
  /** Resolve a stored asset id to a playable URL. */
  playbackUrl(assetId: string): string;
}

function createStorageProvider(
  supabase: SupabaseClient<Database>
): VideoProvider {
  return {
    name: "supabase-storage",

    async createUploadTarget(path) {
      const { data, error } = await supabase.storage
        .from("videos")
        .createSignedUploadUrl(path);
      if (error) throw error;
      return { url: data.signedUrl, assetId: data.path };
    },

    playbackUrl(assetId) {
      return supabase.storage.from("videos").getPublicUrl(assetId).data
        .publicUrl;
    },
  };
}

/**
 * The active provider. When Mux/Cloudflare Stream lands, switch on an env var
 * here (e.g. VIDEO_PROVIDER=mux) and return the real implementation.
 */
export function getVideoProvider(
  supabase: SupabaseClient<Database>
): VideoProvider {
  return createStorageProvider(supabase);
}
