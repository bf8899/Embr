import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/dal";
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; sort?: string }>;
}) {
  const profile = await requireProfile();
  if (!profile.onboarded) {
    redirect("/onboarding");
  }

  const { q, tag, sort } = await searchParams;
  const supabase = await createClient();

  // Build the browse query with search + tag filters. RLS returns live videos
  // plus the viewer's own (including processing ones).
  let query = supabase
    .from("videos")
    .select("*, profiles!videos_creator_id_fkey(handle, display_name)")
    .neq("status", "removed");

  const term = q ? sanitizeSearch(q) : "";
  if (term) query = query.ilike("title", `%${term}%`);
  if (tag) query = query.contains("tags", [tag]);

  const [videosRes, tagPoolRes] = await Promise.all([
    query.order("created_at", { ascending: false }).limit(48),
    // Unfiltered tag pool so the chips surface other tags to jump to.
    supabase.from("videos").select("tags").eq("status", "live").limit(100),
  ]);

  let tiles = (videosRes.data ?? []) as VideoWithCreator[];
  const tags = popularTags(tagPoolRes.data ?? []);

  // "For you" is the default sort; affinity is tag-weighted from the viewer's
  // own likes and tips, with popularity + recency keeping fresh videos visible.
  const forYou = sort !== "newest";
  if (forYou && tiles.length > 1) {
    const weights = buildTagWeights(await getViewerEngagement(supabase, profile.id));
    tiles = rankForYou(tiles, weights);
  }

  const isCreator = profile.role !== "viewer";
  const filtering = !!term || !!tag;

  // Preserve the active search/tag/sort when jumping into Flow.
  const flowParams = new URLSearchParams();
  if (q) flowParams.set("q", q);
  if (tag) flowParams.set("tag", tag);
  if (sort) flowParams.set("sort", sort);
  const flowHref = flowParams.toString() ? `/flow?${flowParams}` : "/flow";

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
            : isCreator
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
