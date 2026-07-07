import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/dal";
import {
  getViewerEngagement,
  buildTagWeights,
  rankForYou,
  sanitizeSearch,
} from "@/lib/feed";
import { VideoTile, type VideoWithCreator } from "@/components/video-tile";
import { BrowseControls } from "@/components/browse-controls";

// Most common tags across a snapshot of live videos, for the quick-filter chips.
function popularTags(rows: { tags: string[] }[], limit = 8): string[] {
  const counts = new Map<string, number>();
  for (const r of rows) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; sort?: string }>;
}) {
  // Public: anyone can browse. Signed-in-but-not-onboarded users finish setup.
  const profile = await getProfile();
  if (profile && !profile.onboarded) {
    redirect("/onboarding");
  }

  const { q, tag, sort } = await searchParams;
  const supabase = await createClient();

  // RLS returns live videos (plus the viewer's own, incl. processing).
  let query = supabase
    .from("videos")
    .select("*, profiles!videos_creator_id_fkey(handle, display_name)")
    .neq("status", "removed");

  const term = q ? sanitizeSearch(q) : "";
  if (term) query = query.ilike("title", `%${term}%`);
  if (tag) query = query.contains("tags", [tag]);

  const [videosRes, tagPoolRes] = await Promise.all([
    query.order("created_at", { ascending: false }).limit(48),
    supabase.from("videos").select("tags").eq("status", "live").limit(100),
  ]);

  let tiles = (videosRes.data ?? []) as VideoWithCreator[];
  const tags = popularTags(tagPoolRes.data ?? []);

  // "For you" (tag-weighted from the viewer's own likes/tips) is the default for
  // signed-in users; anonymous visitors just get newest-first.
  const forYou = sort !== "newest";
  if (profile && forYou && tiles.length > 1) {
    const weights = buildTagWeights(await getViewerEngagement(supabase, profile.id));
    tiles = rankForYou(tiles, weights);
  }

  const isCreator = profile && profile.role !== "viewer";
  const filtering = !!term || !!tag;

  const flowParams = new URLSearchParams();
  if (q) flowParams.set("q", q);
  if (tag) flowParams.set("tag", tag);
  if (sort) flowParams.set("sort", sort);
  const flowHref = flowParams.toString() ? `/flow?${flowParams}` : "/flow";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {profile ? `Welcome, ${profile.display_name}` : "Browse Ember"}
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            {profile
              ? "Fresh video, ranked for you."
              : "Watch free. Hold the flame to send embers to creators you love."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-line p-0.5 text-sm">
            <span className="rounded-full bg-pane-2 px-4 py-1.5 font-medium text-ink">
              Tiles
            </span>
            <Link
              href={flowHref}
              className="rounded-full px-4 py-1.5 text-ink-dim hover:text-ink"
            >
              Flow
            </Link>
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
      </div>

      <BrowseControls q={q} tag={tag} sort={sort} tags={tags} />

      {tiles.length === 0 ? (
        <div className="mt-10 rounded-[22px] border border-dashed border-line p-12 text-center text-ink-faint">
          {filtering
            ? "No videos match that search."
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
