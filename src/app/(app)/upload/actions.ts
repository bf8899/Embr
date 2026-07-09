"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireProfile } from "@/lib/supabase/dal";
import {
  activeProvider,
  createStorageUploadTarget,
  storagePlaybackUrl,
} from "@/lib/video/provider";
import { createMuxDirectUpload } from "@/lib/video/mux";
import { maxUploadBytes } from "@/lib/video/constants";
import { getPlatformSettings, effectiveClipCap, canUpload } from "@/lib/clips";

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
  sizeBytes: z.number().int().positive(),
  durationSeconds: z.number().nonnegative().finite(),
});

export type CreateUploadResult =
  | { provider: "mux"; videoId: string; uploadUrl: string }
  | {
      provider: "storage";
      videoId: string;
      uploadUrl: string;
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

  const supabase = await createClient();
  const settings = await getPlatformSettings(supabase);

  // Bootstrap phase: only admins upload until creator_uploads_open is flipped.
  if (!canUpload(profile, settings)) {
    return { error: "Creator uploads aren't open yet." };
  }

  const validated = CreateUploadSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }
  const { title, description, tags, contentType, sizeBytes, durationSeconds } =
    validated.data;

  const provider = activeProvider();

  if (sizeBytes > maxUploadBytes(provider)) {
    return { error: "That file is too large." };
  }

  // Enforce the effective clip-length cap (per-creator override, else platform
  // default) before anything is stored.
  const cap = effectiveClipCap(profile, settings);
  if (durationSeconds > cap) {
    return {
      error: `Your clips are capped at ${cap} seconds — this one is ${Math.round(
        durationSeconds
      )}s. Trim it, or request a higher limit from your profile.`,
    };
  }

  const videoId = crypto.randomUUID();

  if (provider === "mux") {
    // Mux ingests asynchronously: create a direct upload now, insert the row as
    // 'processing', and let the asset.ready webhook fill in playback id +
    // duration + thumbnail and flip it 'live'.
    const origin =
      (await headers()).get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "*";
    let upload;
    try {
      upload = await createMuxDirectUpload(origin);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Upload setup failed." };
    }

    const { error } = await supabase.from("videos").insert({
      id: videoId,
      creator_id: profile.id,
      title,
      description: description || null,
      tags,
      provider: "mux",
      mux_upload_id: upload.uploadId,
      video_asset_id: null,
    });
    if (error) return { error: error.message };

    return { provider: "mux", videoId, uploadUrl: upload.url };
  }

  // Storage stub: signed PUT targets for the video + a client-made thumbnail.
  const ext = EXT_BY_TYPE[contentType];
  let videoTarget, thumbnailTarget;
  try {
    videoTarget = await createStorageUploadTarget(
      supabase,
      `${profile.id}/${videoId}.${ext}`
    );
    thumbnailTarget = await createStorageUploadTarget(
      supabase,
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
    provider: "storage",
    video_asset_id: videoTarget.assetId,
  });
  if (error) return { error: error.message };

  return {
    provider: "storage",
    videoId,
    uploadUrl: videoTarget.url,
    thumbnailUploadUrl: thumbnailTarget.url,
  };
}

const FinalizeSchema = z.object({
  videoId: z.uuid(),
  durationSeconds: z.number().nonnegative().finite(),
  hasThumbnail: z.boolean(),
});

// Storage-only finalize: the client has PUT its file + thumbnail, so mark the
// row live with the measured duration and thumbnail URL. Mux videos are NOT
// finalized here — their asset.ready webhook flips them live once transcoded.
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
  const thumbnailUrl = hasThumbnail
    ? storagePlaybackUrl(supabase, `${user.id}/${videoId}.jpg`)
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
    .eq("provider", "storage")
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Video not found." };
  }
  return { ok: true };
}
