import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { VideoWithCreator } from "@/components/video-tile";

type Client = SupabaseClient<Database>;

// Turning engagement into tag affinity, then affinity into a ranking. Tuned for
// the tag-weighted "for you" feel of the demo: a tip is a stronger signal than a
// like, affinity dominates once a viewer has history, and fresh + popular videos
// stay visible for viewers with no history yet.
const LIKE_POINTS = 1;
const TIP_POINTS_PER_EMBER = 0.2; // a 10-ember tip ≈ 2 points (2× a like)
const W_AFFINITY = 4;
const W_RECENCY = 3;

// Neutralize ilike wildcards (%) and PostgREST filter punctuation in a raw
// search term so it's matched literally.
export function sanitizeSearch(term: string): string {
  return term.replace(/[%,(){}]/g, " ").trim();
}

export type ViewerEngagement = {
  likedTags: string[][];
  tippedTags: { tags: string[]; amount: number }[];
};

// One row per video the viewer liked / tipped, carrying that video's tags.
export async function getViewerEngagement(
  supabase: Client,
  userId: string
): Promise<ViewerEngagement> {
  const [likes, tips] = await Promise.all([
    supabase.from("likes").select("videos(tags)").eq("user_id", userId),
    supabase
      .from("tips")
      .select("amount, videos(tags)")
      .eq("sender_id", userId)
      .not("video_id", "is", null),
  ]);

  type TagsEmbed = { tags: string[] } | null;
  const likedTags = ((likes.data ?? []) as { videos: TagsEmbed }[]).map(
    (r) => r.videos?.tags ?? []
  );
  const tippedTags = (
    (tips.data ?? []) as { amount: number; videos: TagsEmbed }[]
  ).map((r) => ({ tags: r.videos?.tags ?? [], amount: r.amount }));

  return { likedTags, tippedTags };
}

export function buildTagWeights(e: ViewerEngagement): Map<string, number> {
  const weights = new Map<string, number>();
  const add = (tags: string[], points: number) => {
    for (const t of tags) weights.set(t, (weights.get(t) ?? 0) + points);
  };
  for (const tags of e.likedTags) add(tags, LIKE_POINTS);
  for (const { tags, amount } of e.tippedTags) add(tags, amount * TIP_POINTS_PER_EMBER);
  return weights;
}

// Log-scaled so a runaway-popular video doesn't drown out a viewer's tag
// affinity — a mega-hit is "a bit more popular", not 100× more. For a viewer
// with no history this term (plus recency) drives the whole order.
function popularity(v: VideoWithCreator): number {
  const raw = v.like_count + v.ember_count / 5 + v.view_count / 10;
  return Math.log2(1 + raw);
}

function recency(iso: string): number {
  const ageHours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  return 1 / (1 + ageHours / 24); // 1.0 brand new, 0.5 at a day old, decays
}

export function forYouScore(
  v: VideoWithCreator,
  weights: Map<string, number>
): number {
  let affinity = 0;
  for (const t of v.tags) affinity += weights.get(t) ?? 0;
  return affinity * W_AFFINITY + popularity(v) + recency(v.created_at) * W_RECENCY;
}

// Stable-ish sort: score desc, newest as the tiebreak.
export function rankForYou(
  videos: VideoWithCreator[],
  weights: Map<string, number>
): VideoWithCreator[] {
  return [...videos]
    .map((v) => ({ v, s: forYouScore(v, weights) }))
    .sort(
      (a, b) =>
        b.s - a.s ||
        new Date(b.v.created_at).getTime() - new Date(a.v.created_at).getTime()
    )
    .map((x) => x.v);
}
