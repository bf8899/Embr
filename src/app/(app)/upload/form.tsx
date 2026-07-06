"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createUpload, finalizeUpload } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCEPTED_VIDEO_TYPES, MAX_VIDEO_BYTES } from "@/lib/video/constants";

type Stage =
  | { name: "idle" }
  | { name: "uploading"; percent: number }
  | { name: "processing" }
  | { name: "error"; message: string };

function putToSignedUrl(url: string, body: Blob, onProgress?: (pct: number) => void) {
  // Mirrors supabase-js uploadToSignedUrl (FormData PUT), but via XHR so we
  // get upload progress events, which fetch doesn't expose.
  return new Promise<void>((resolve, reject) => {
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", body);

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed — network error."));
    xhr.send(form);
  });
}

async function readVideoMetadata(file: File): Promise<{
  durationSeconds: number;
  thumbnail: Blob | null;
}> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("unreadable"));
    });
    const durationSeconds = isFinite(video.duration) ? video.duration : 0;

    let thumbnail: Blob | null = null;
    try {
      video.currentTime = Math.min(1, durationSeconds / 2);
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("seek failed"));
      });
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 640 / (video.videoWidth || 640));
      canvas.width = Math.round((video.videoWidth || 640) * scale);
      canvas.height = Math.round((video.videoHeight || 360) * scale);
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      thumbnail = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8)
      );
    } catch {
      // Codec drew nothing or seek failed — ship without a thumbnail.
    }
    return { durationSeconds, thumbnail };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function UploadForm({ capSeconds }: { capSeconds: number }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = stage.name === "uploading" || stage.name === "processing";

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_VIDEO_BYTES) {
      setStage({ name: "error", message: "That file is over the 50 MB cap." });
      setFile(null);
      e.target.value = "";
      return;
    }
    setStage({ name: "idle" });
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || busy) return;

    const form = new FormData(e.currentTarget);
    const tags = String(form.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      setStage({ name: "uploading", percent: 0 });

      const metadata = await readVideoMetadata(file).catch(() => ({
        durationSeconds: 0,
        thumbnail: null,
      }));

      // Friendly early stop before uploading; the server enforces this too.
      if (metadata.durationSeconds > capSeconds) {
        setStage({
          name: "error",
          message: `Clips are capped at ${capSeconds}s right now — this one is ${Math.round(
            metadata.durationSeconds
          )}s.`,
        });
        return;
      }

      const created = await createUpload({
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        tags,
        contentType: file.type,
        sizeBytes: file.size,
        durationSeconds: metadata.durationSeconds,
      });
      if ("error" in created) {
        setStage({ name: "error", message: created.error });
        return;
      }

      await putToSignedUrl(created.videoUploadUrl, file, (percent) =>
        setStage({ name: "uploading", percent })
      );
      if (metadata.thumbnail) {
        await putToSignedUrl(created.thumbnailUploadUrl, metadata.thumbnail).catch(
          () => {
            metadata.thumbnail = null;
          }
        );
      }

      setStage({ name: "processing" });
      const finalized = await finalizeUpload({
        videoId: created.videoId,
        durationSeconds: metadata.durationSeconds,
        hasThumbnail: metadata.thumbnail !== null,
      });
      if ("error" in finalized) {
        setStage({ name: "error", message: finalized.error });
        return;
      }

      router.push(`/v/${created.videoId}`);
    } catch (err) {
      setStage({
        name: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="file" className="mb-1.5 block text-xs text-ink-dim">
          Video file
        </label>
        <input
          ref={fileInputRef}
          id="file"
          type="file"
          accept={ACCEPTED_VIDEO_TYPES.join(",")}
          onChange={onFileChange}
          disabled={busy}
          required
          className="w-full rounded-[14px] border border-line bg-pane px-4 py-3 text-sm text-ink-dim file:mr-3 file:rounded-full file:border-0 file:bg-pane-2 file:px-4 file:py-1.5 file:text-ink file:cursor-pointer"
        />
      </div>

      <div>
        <label htmlFor="title" className="mb-1.5 block text-xs text-ink-dim">
          Title
        </label>
        <Input id="title" name="title" maxLength={120} required disabled={busy} />
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-xs text-ink-dim">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          disabled={busy}
          className="w-full rounded-[14px] border border-line bg-pane px-4 py-3 text-ink placeholder:text-ink-faint outline-none focus:border-ember-2"
        />
      </div>

      <div>
        <label htmlFor="tags" className="mb-1.5 block text-xs text-ink-dim">
          Tags <span className="text-ink-faint">(comma-separated, up to 8)</span>
        </label>
        <Input id="tags" name="tags" placeholder="music, live, acoustic" disabled={busy} />
      </div>

      {stage.name === "uploading" && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-ink-dim">
            <span>Uploading…</span>
            <span>{stage.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-pane-2">
            <div
              className="h-full rounded-full bg-[image:var(--ember-grad)] transition-[width] duration-200"
              style={{ width: `${stage.percent}%` }}
            />
          </div>
        </div>
      )}
      {stage.name === "processing" && (
        <p className="text-xs text-ink-dim">Processing…</p>
      )}
      {stage.name === "error" && (
        <p className="text-xs text-ember-3">{stage.message}</p>
      )}

      <Button type="submit" disabled={busy || !file} className="mt-2 w-full">
        {stage.name === "uploading"
          ? `Uploading ${stage.percent}%`
          : stage.name === "processing"
            ? "Processing…"
            : "Upload"}
      </Button>
    </form>
  );
}
