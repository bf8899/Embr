"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireProfile } from "@/lib/supabase/dal";
import { getVideoProvider } from "@/lib/video/provider";
import { MAX_VIDEO_BYTES } from "@/lib/video/constants";

const EXT_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const CreateUploadSchema = z.object({
  title: z.string().trim().min(1, { error: "Give it a title." }).max(120),
  description: z.string().trim().max(2000),
  tags: z
    .array(z.string().trim().toLowerCase().min(1).max(24))
    .max(8, { error: "At most 8 tags." }),
  contentType: z.enum(Object.keys(EXT_BY_TYPE) as [string, ...string[]], {
    error: "Use an MP4, WebM, or MOV file.",
  }),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_VIDEO_BYTES, { error: "Videos are capped at 50 MB for now." }),
});

export type CreateUploadResult =
  | {
      videoId: string;
      videoUploadUrl: string;
      thumbnailUploadUrl: string;
    }
  | { error: string };

export async function createUpload(
  input: z.input<typeof CreateUploadSchema>
): Promise<CreateUploadResult> {
  const profile = await requireProfile();
  if (profile.role === "viewer") {
    return { error: "Switch your role to creator on your profile to upload." };
  }

  const validated = CreateUploadSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }
  const { title, description, tags, contentType } = validated.data;

  const videoId = crypto.randomUUID();
  const ext = EXT_BY_TYPE[contentType];
  const supabase = await createClient();
  const provider = getVideoProvider(supabase);

  let videoTarget, thumbnailTarget;
  try {
    videoTarget = await provider.createUploadTarget(
      `${profile.id}/${videoId}.${ext}`
    );
    thumbnailTarget = await provider.createUploadTarget(
      `${profile.id}/${videoId}.jpg`
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload setup failed." };
  }

  const { error } = await supabase.from("videos").insert({
    id: videoId,
    creator_id: profile.id,
    title,
    description: description || null,
    tags,
    video_asset_id: videoTarget.assetId,
  });
  if (error) {
    return { error: error.message };
  }

  return {
    videoId,
    videoUploadUrl: videoTarget.url,
    thumbnailUploadUrl: thumbnailTarget.url,
  };
}

const FinalizeSchema = z.object({
  videoId: z.uuid(),
  durationSeconds: z.number().nonnegative().finite(),
  hasThumbnail: z.boolean(),
});

export async function finalizeUpload(
  input: z.input<typeof FinalizeSchema>
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const validated = FinalizeSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }
  const { videoId, durationSeconds, hasThumbnail } = validated.data;

  const supabase = await createClient();
  const provider = getVideoProvider(supabase);
  const thumbnailUrl = hasThumbnail
    ? provider.playbackUrl(`${user.id}/${videoId}.jpg`)
    : null;

  const { data, error } = await supabase
    .from("videos")
    .update({
      duration_seconds: Math.round(durationSeconds),
      thumbnail_url: thumbnailUrl,
      status: "live",
    })
    .eq("id", videoId)
    .eq("creator_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Video not found." };
  }
  return { ok: true };
}
