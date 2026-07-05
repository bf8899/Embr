import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/dal";
import { getVideoProvider } from "@/lib/video/provider";
import { formatDuration, formatViews } from "@/lib/format";
import type { VideoWithCreator } from "@/components/video-tile";
import { LikeButton } from "@/components/like-button";
import { FollowButton } from "@/components/follow-button";
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

  // Social state for the signed-in viewer + the comment thread.
  const [likeRes, followRes, commentsRes, followerCountRes] = await Promise.all([
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
      .select("id, body, created_at, profiles(handle, display_name)")
      .eq("video_id", video.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", video.creator_id),
  ]);

  const liked = !!likeRes.data;
  const following = !!followRes.data;
  const comments = (commentsRes.data ?? []) as CommentView[];
  const followerCount = followerCountRes.count ?? 0;

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
      <p className="mt-1 text-sm text-ink-faint">
        {formatViews(video.view_count)} views
        {duration && <> · {duration}</>}
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

      <Comments videoId={video.id} comments={comments} />

      <p className="mt-8 text-sm">
        <Link href="/dashboard" className="text-ink-dim hover:text-ink">
          ← Back to browse
        </Link>
      </p>
    </div>
  );
}
