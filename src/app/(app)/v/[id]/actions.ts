"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/dal";
import { TIP_AMOUNT, tipErrorMessage } from "@/lib/tips";

async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.id;
}

export async function toggleLike(
  videoId: string,
  liked: boolean
): Promise<{ liked: boolean } | { error: string }> {
  const userId = await requireUserId();
  const supabase = await createClient();

  if (liked) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("video_id", videoId);
    if (error) return { error: error.message };
    revalidatePath(`/v/${videoId}`);
    return { liked: false };
  }

  const { error } = await supabase
    .from("likes")
    .insert({ user_id: userId, video_id: videoId });
  // Unique-violation means it was already liked — treat as success (idempotent).
  if (error && error.code !== "23505") return { error: error.message };
  revalidatePath(`/v/${videoId}`);
  return { liked: true };
}

export async function toggleFollow(
  creatorId: string,
  following: boolean
): Promise<{ following: boolean } | { error: string }> {
  const userId = await requireUserId();
  if (creatorId === userId) return { error: "You can't follow yourself." };
  const supabase = await createClient();

  if (following) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("creator_id", creatorId);
    if (error) return { error: error.message };
    return { following: false };
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: userId, creator_id: creatorId });
  if (error && error.code !== "23505") return { error: error.message };
  return { following: true };
}

export async function sendTip(
  target: { videoId: string } | { commentId: string }
): Promise<{ balance: number } | { error: string }> {
  await requireUserId();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("send_tip", {
    p_amount: TIP_AMOUNT,
    p_video_id: "videoId" in target ? target.videoId : undefined,
    p_comment_id: "commentId" in target ? target.commentId : undefined,
  });
  if (error) return { error: tipErrorMessage(error.message) };

  // Refresh the watch page so the ember bar, leaderboard, and comment totals
  // reflect the tip on the next load. The wallet badge updates optimistically
  // from the returned balance in the meantime.
  const videoId = "videoId" in target ? target.videoId : undefined;
  if (videoId) revalidatePath(`/v/${videoId}`);

  return { balance: data as number };
}

const CommentSchema = z.object({
  videoId: z.uuid(),
  body: z.string().trim().min(1, { error: "Say something first." }).max(1000),
});

export async function postComment(
  input: z.input<typeof CommentSchema>
): Promise<{ ok: true } | { error: string }> {
  const userId = await requireUserId();

  const validated = CommentSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    video_id: validated.data.videoId,
    user_id: userId,
    body: validated.data.body,
  });
  if (error) return { error: error.message };

  revalidatePath(`/v/${validated.data.videoId}`);
  return { ok: true };
}
