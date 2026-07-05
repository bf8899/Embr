import type { Tables, Enums } from "@/lib/supabase/types";

export type Profile = Tables<"profiles">;
export type ProfileRole = Enums<"profile_role">;

export type Video = Tables<"videos">;
export type VideoStatus = Enums<"video_status">;

export type Comment = Tables<"comments">;
export type Like = Tables<"likes">;
export type Follow = Tables<"follows">;
