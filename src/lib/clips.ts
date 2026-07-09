import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { Profile, PlatformSettings } from "@/lib/supabase/models";

type Client = SupabaseClient<Database>;

// Fallback default if the singleton settings row is somehow unreadable.
const FALLBACK_DEFAULT_CLIP_SECONDS = 60;

export type PlatformConfig = Pick<
  PlatformSettings,
  | "default_clip_seconds"
  | "creator_uploads_open"
  | "beta_mode"
  | "ads_enabled"
  | "ad_frequency"
>;

export async function getPlatformSettings(supabase: Client): Promise<PlatformConfig> {
  const { data } = await supabase
    .from("platform_settings")
    .select(
      "default_clip_seconds, creator_uploads_open, beta_mode, ads_enabled, ad_frequency"
    )
    .eq("id", 1)
    .maybeSingle();

  return {
    default_clip_seconds: data?.default_clip_seconds ?? FALLBACK_DEFAULT_CLIP_SECONDS,
    creator_uploads_open: data?.creator_uploads_open ?? false,
    beta_mode: data?.beta_mode ?? false,
    ads_enabled: data?.ads_enabled ?? false,
    ad_frequency: data?.ad_frequency ?? 6,
  };
}

// A creator's personal override wins; otherwise the platform-wide default.
export function effectiveClipCap(profile: Profile, settings: PlatformConfig): number {
  return profile.max_clip_seconds ?? settings.default_clip_seconds;
}

// During the bootstrap phase (creator_uploads_open = false), only admins upload.
export function canUpload(profile: Profile, settings: PlatformConfig): boolean {
  return profile.is_admin || settings.creator_uploads_open;
}
