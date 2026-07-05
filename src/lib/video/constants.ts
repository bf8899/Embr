// 50 MB — Supabase free-tier upload cap; raise when a real video provider lands.
export const MAX_VIDEO_BYTES = 52428800;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;
