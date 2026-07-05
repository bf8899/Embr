import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/dal";
import { VideoTile, type VideoWithCreator } from "@/components/video-tile";

export default async function DashboardPage() {
  const profile = await requireProfile();

  if (!profile.onboarded) {
    redirect("/onboarding");
  }

  // RLS returns live videos plus the viewer's own (including processing ones),
  // which is exactly what the grid should show.
  const supabase = await createClient();
  const { data: videos } = await supabase
    .from("videos")
    .select("*, profiles(handle, display_name)")
    .neq("status", "removed")
    .order("created_at", { ascending: false })
    .limit(48);

  const tiles = (videos ?? []) as VideoWithCreator[];
  const isCreator = profile.role !== "viewer";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Welcome, {profile.display_name}
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            You&apos;re signed up as a{" "}
            <span className="text-ink">
              {profile.role === "both" ? "viewer and creator" : profile.role}
            </span>
            .
          </p>
        </div>
        {isCreator && (
          <Link
            href="/upload"
            className="rounded-full bg-[image:var(--ember-grad)] px-5 py-2.5 font-display text-sm font-semibold text-[#1A0A08] shadow-[0_6px_20px_-6px_rgba(255,92,57,0.55)] hover:brightness-110"
          >
            Upload
          </Link>
        )}
      </div>

      {tiles.length === 0 ? (
        <div className="mt-10 rounded-[22px] border border-dashed border-line p-12 text-center text-ink-faint">
          {isCreator
            ? "No videos yet — yours could be the first."
            : "No videos yet. Check back soon."}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {tiles.map((video) => (
            <VideoTile key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
