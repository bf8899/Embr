import type { Tables, Enums } from "@/lib/supabase/types";

export type Profile = Tables<"profiles">;
export type ProfileRole = Enums<"profile_role">;

export type Video = Tables<"videos">;
export type VideoStatus = Enums<"video_status">;

export type Comment = Tables<"comments">;
export type Like = Tables<"likes">;
export type Follow = Tables<"follows">;
export type Tip = Tables<"tips">;

export type Report = Tables<"reports">;
export type ReportTarget = Enums<"report_target">;
export type ReportStatus = Enums<"report_status">;

export type PlatformSettings = Tables<"platform_settings">;
export type ClipLengthRequest = Tables<"clip_length_requests">;
