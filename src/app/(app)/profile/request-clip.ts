"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/dal";

// A creator asks for a higher personal clip-length ceiling. This never grants
// anything — it just files a pending request for an admin to review, capturing
// the creator's tip standing as context.
export async function requestClipLength(
  seconds: number
): Promise<{ ok: true } | { error: string }> {
  const profile = await requireProfile();
  if (profile.role === "viewer") {
    return { error: "Only creators can request a higher limit." };
  }
  if (!Number.isInteger(seconds) || seconds <= 0) {
    return { error: "Enter a whole number of seconds." };
  }

  const supabase = await createClient();

  // Don't let a creator stack multiple pending requests.
  const { data: existing } = await supabase
    .from("clip_length_requests")
    .select("id")
    .eq("creator_id", profile.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return { error: "You already have a request pending review." };
  }

  const { data: standing } = await supabase.rpc("creator_tip_standing", {
    p_creator: profile.id,
  });
  const row = standing?.[0];

  const { error } = await supabase.from("clip_length_requests").insert({
    creator_id: profile.id,
    requested_seconds: seconds,
    cumulative_tips_at_request: row?.cumulative ?? 0,
    leaderboard_rank_at_request: row?.rank ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { ok: true };
}
