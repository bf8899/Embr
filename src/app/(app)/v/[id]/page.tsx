import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/dal";
import { getVideoProvider } from "@/lib/video/provider";
import { formatDuration, formatViews } from "@/lib/format";
import type { VideoWithCreator } from "@/components/video-tile";
import { LikeButton } from "@/components/like-button";
import { FollowButton } from "@/components/follow-button";
import { TipButton } from "@/components/tip-button";
import { TipLeaderboard, type LeaderRow } from "@/components/tip-leaderboard";
import { Comments, type CommentView } from "@/components/comments";
import { ViewPing } from "./view-ping";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("videos")
    .select("*, profiles!videos_creator_id_fkey(handle, display_name)")
    .eq("id", id)
    .single();

  // RLS hides other people's non-live videos, so a miss covers both
  // "doesn't exist" and "not allowed to see it".
  if (!data || data.status === "removed") {
    notFound();
  }
  const video = data as VideoWithCreator;

  const user = await getCurrentUser();
  const isOwner = user?.id === video.creator_id;

  if (video.status === "processing") {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <div className="grid aspect-video place-items-center rounded-[22px] border border-line bg-pane text-ink-dim">
          Still processing — check back in a moment.
        </div>
        <h1 className="mt-4 font-display text-xl font-bold">{video.title}</h1>
      </div>
    );
  }

  const provider = getVideoProvider(supabase);
  const src = provider.playbackUrl(video.video_asset_id);
  const duration = formatDuration(video.duration_seconds);

  // Social state for the signed-in viewer + the comment thread + tip data.
  const [likeRes, followRes, commentsRes, followerCountRes, leaderRes, commentTipsRes] =
    await Promise.all([
      user
        ? supabase
            .from("likes")
            .select("video_id")
            .eq("video_id", video.id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      user && !isOwner
        ? supabase
            .from("follows")
            .select("creator_id")
            .eq("creator_id", video.creator_id)
            .eq("follower_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("comments")
        .select("id, body, created_at, user_id, profiles(handle, display_name)")
        .eq("video_id", video.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", video.creator_id),
      supabase.rpc("video_tip_leaderboard", { p_video_id: video.id }),
      supabase
        .from("tips")
        .select("comment_id, amount")
        .eq("video_id", video.id)
        .not("comment_id", "is", null),
    ]);

  const liked = !!likeRes.data;
  const following = !!followRes.data;
  const comments = (commentsRes.data ?? []) as CommentView[];
  const followerCount = followerCountRes.count ?? 0;
  const leaders = (leaderRes.data ?? []) as LeaderRow[];

  // Fold the raw comment-tip rows into a { commentId: total } map.
  const tipTotals: Record<string, number> = {};
  for (const t of commentTipsRes.data ?? []) {
    if (t.comment_id) tipTotals[t.comment_id] = (tipTotals[t.comment_id] ?? 0) + t.amount;
  }

  return (
    <div className="mx-auto max-w-3xl">
      {!isOwner && <ViewPing videoId={video.id} />}

      <video
        controls
        playsInline
        poster={video.thumbnail_url ?? undefined}
        src={src}
        className="aspect-video w-full rounded-[22px] border border-line bg-black"
      />

      <h1 className="mt-4 font-display text-xl font-bold">{video.title}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-faint">
        <span>{formatViews(video.view_count)} views</span>
        {duration && <span>· {duration}</span>}
        {video.ember_count > 0 && (
          <span className="inline-flex items-center gap-1 text-ember-1">
            ·
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
              <path d="M12 2c.4 3-1.6 4.4-2.8 5.9C8 9.4 7.2 10.8 7.2 13a4.8 4.8 0 0 0 9.6.3c0-2.2-1-3.6-2-5-.5.9-1 1.4-1.8 1.7.6-2.6-.2-5.6-1-8z" />
            </svg>
            {formatViews(video.ember_count)} embers
          </span>
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
        <div>
          <p className="text-sm font-medium text-ink">
            @{video.profiles?.handle ?? "unknown"}
          </p>
          <p className="text-xs text-ink-faint">
            {formatViews(followerCount)}{" "}
            {followerCount === 1 ? "follower" : "followers"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <LikeButton
              videoId={video.id}
              initialLiked={liked}
              initialCount={video.like_count}
            />
          )}
          {user && !isOwner && (
            <TipButton target={{ videoId: video.id }} variant="inline" />
          )}
          {user && !isOwner && (
            <FollowButton
              creatorId={video.creator_id}
              initialFollowing={following}
            />
          )}
        </div>
      </div>

      {video.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm text-ink-dim">
          {video.description}
        </p>
      )}

      {video.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {video.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line px-3 py-1 text-xs text-ink-dim"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <TipLeaderboard rows={leaders} />

      <Comments
        videoId={video.id}
        comments={comments}
        currentUserId={user?.id ?? null}
        tipTotals={tipTotals}
      />

      <p className="mt-8 text-sm">
        <Link href="/dashboard" className="text-ink-dim hover:text-ink">
          ← Back to browse
        </Link>
      </p>
    </div>
  );
}
