import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/dal";
import { getVideoProvider } from "@/lib/video/provider";
import {
  getViewerEngagement,
  buildTagWeights,
  rankForYou,
  sanitizeSearch,
} from "@/lib/feed";
import { FlowFeed, type FlowVideo } from "@/components/flow-feed";
import type { VideoWithCreator } from "@/components/video-tile";

export default async function FlowPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; sort?: string }>;
}) {
  const supabase = await createClient();
  const provider = getVideoProvider(supabase);
  const user = await getCurrentUser();
  const { q, tag, sort } = await searchParams;

  // Mirror the dashboard's search + tag filters so Flow flows the same set.
  let query = supabase
    .from("videos")
    .select("*, profiles!videos_creator_id_fkey(handle, display_name)")
    .eq("status", "live");

  const term = q ? sanitizeSearch(q) : "";
  if (term) query = query.ilike("title", `%${term}%`);
  if (tag) query = query.contains("tags", [tag]);

  const { data } = await query.order("created_at", { ascending: false }).limit(20);

  let videos = (data ?? []) as VideoWithCreator[];

  // Same "for you" ordering as the dashboard (default), unless newest is asked.
  if (user && sort !== "newest" && videos.length > 1) {
    const weights = buildTagWeights(await getViewerEngagement(supabase, user.id));
    videos = rankForYou(videos, weights);
  }

  // Which of these the viewer already liked, and which creators they follow —
  // one query each rather than per-video.
  const [likedRes, followingRes] = await Promise.all([
    user && videos.length
      ? supabase
          .from("likes")
          .select("video_id")
          .eq("user_id", user.id)
          .in("video_id", videos.map((v) => v.id))
      : Promise.resolve({ data: [] as { video_id: string }[] }),
    user && videos.length
      ? supabase
          .from("follows")
          .select("creator_id")
          .eq("follower_id", user.id)
          .in("creator_id", videos.map((v) => v.creator_id))
      : Promise.resolve({ data: [] as { creator_id: string }[] }),
  ]);

  const likedSet = new Set((likedRes.data ?? []).map((r) => r.video_id));
  const followingSet = new Set(
    (followingRes.data ?? []).map((r) => r.creator_id)
  );

  const feed: FlowVideo[] = videos.map((v) => ({
    id: v.id,
    title: v.title,
    creatorId: v.creator_id,
    handle: v.profiles?.handle ?? "unknown",
    src: provider.playbackUrl(v.video_asset_id),
    poster: v.thumbnail_url,
    likeCount: v.like_count,
    emberCount: v.ember_count,
    liked: likedSet.has(v.id),
    following: followingSet.has(v.creator_id),
    isOwn: user?.id === v.creator_id,
  }));

  if (feed.length === 0) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-void text-center">
        <div>
          <p className="text-ink-dim">No videos to flow through yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-ink underline underline-offset-4"
          >
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return <FlowFeed videos={feed} signedIn={!!user} />;
}
