import type { Tables, Enums } from "@/lib/supabase/types";

export type Profile = Tables<"profiles">;
export type ProfileRole = Enums<"profile_role">;
