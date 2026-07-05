import Link from "next/link";
import { requireProfile } from "@/lib/supabase/dal";
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

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-bold">Upload a video</h1>
      <p className="mt-1 text-sm text-ink-dim">
        MP4, WebM, or MOV — up to 50 MB while we&apos;re on the starter
        pipeline.
      </p>
      <UploadForm />
    </div>
  );
}
