import Link from "next/link";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { getPlatformSettings, effectiveClipCap, canUpload } from "@/lib/clips";
import { activeProvider } from "@/lib/video/provider";
import { UploadForm } from "./form";

export default async function UploadPage() {
  const profile = await requireProfile();

  if (profile.role === "viewer") {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl font-bold">Creators only</h1>
        <p className="mt-2 text-sm text-ink-dim">
          Switch your role to creator (or both) on your{" "}
          <Link href="/profile" className="text-ink underline underline-offset-4">
            profile
          </Link>{" "}
          to start uploading.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const settings = await getPlatformSettings(supabase);

  // Bootstrap phase: uploads are open to admins only until the owner flips the
  // creator_uploads_open flag. Creator-role users get a friendly holding page.
  if (!canUpload(profile, settings)) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl font-bold">
          Creator uploads aren&apos;t open yet
        </h1>
        <p className="mt-2 text-sm text-ink-dim">
          Ember is in an early bootstrap phase — we&apos;re building the catalogue
          before opening uploads to everyone. Your creator account is ready, and
          you&apos;ll be able to post as soon as we open the doors.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/browse" className="text-ink-dim hover:text-ink">
            ← Back to browse
          </Link>
        </p>
      </div>
    );
  }

  const cap = effectiveClipCap(profile, settings);
  const provider = activeProvider();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-bold">Upload a video</h1>
      <p className="mt-1 text-sm text-ink-dim">
        MP4, WebM, or MOV — {cap} seconds max
        {provider === "storage" ? ", up to 50 MB" : ""}. We&apos;ll transcode it
        {provider === "mux" ? " and it goes live once processing finishes" : ""}.
      </p>
      <UploadForm capSeconds={cap} provider={provider} />
    </div>
  );
}
