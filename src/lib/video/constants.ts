// 50 MB — Supabase free-tier upload cap for the legacy storage provider.
export const MAX_STORAGE_BYTES = 52428800;
// Mux ingests large files fine; this is just a sanity bound (clips are short
// anyway, bounded by the clip-length cap). 1 GB.
export const MAX_MUX_BYTES = 1073741824;

export function maxUploadBytes(provider: "storage" | "mux"): number {
  return provider === "mux" ? MAX_MUX_BYTES : MAX_STORAGE_BYTES;
}

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;
