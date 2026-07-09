"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LikeButton } from "@/components/like-button";
import { FollowButton } from "@/components/follow-button";
import { TipButton } from "@/components/tip-button";
import { WalletBadge } from "@/components/wallet";
import { LiveChat } from "@/components/live-chat";
import { HlsVideo } from "@/components/hls-video";

export type FlowVideo = {
  id: string;
  title: string;
  creatorId: string;
  handle: string;
  src: string;
  hls: boolean;
  poster: string | null;
  likeCount: number;
  emberCount: number;
  liked: boolean;
  following: boolean;
  isOwn: boolean;
};

export function FlowFeed({
  videos,
  signedIn,
  userId,
}: {
  videos: FlowVideo[];
  signedIn: boolean;
  userId: string | null;
}) {
  const [muted, setMuted] = useState(true);
  const [activeId, setActiveId] = useState(videos[0]?.id ?? "");
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const viewed = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Play whichever slide is mostly in view, pause the rest, and count a
    // view the first time each becomes active.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLVideoElement;
          const id = el.dataset.videoId!;
          const own = el.dataset.own === "true";
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            el.play().catch(() => {});
            setActiveId(id);
            if (!own && !viewed.current.has(id)) {
              viewed.current.add(id);
              createClient()
                .rpc("increment_view_count", { video_id: id })
                .then(() => {});
            }
          } else {
            el.pause();
          }
        }
      },
      { threshold: [0, 0.6, 1] }
    );

    for (const v of videoRefs.current) if (v) observer.observe(v);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-void">
      {activeId && <LiveChat videoId={activeId} userId={userId} />}

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Link
            href="/browse"
            aria-label="Back to browse"
            className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-ink backdrop-blur hover:bg-black/60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          {signedIn && <WalletBadge />}
        </div>
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-ink backdrop-blur hover:bg-black/60"
        >
          {muted ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
            </svg>
          )}
        </button>
      </div>

      <div className="h-full snap-y snap-mandatory overflow-y-scroll">
        {videos.map((v, i) => (
          <section
            key={v.id}
            className="relative flex h-full snap-start items-center justify-center"
          >
            <HlsVideo
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              src={v.src}
              hls={v.hls}
              data-video-id={v.id}
              data-own={v.isOwn ? "true" : "false"}
              poster={v.poster ?? undefined}
              muted={muted}
              loop
              playsInline
              onClick={(e) => {
                const el = e.currentTarget;
                el.paused ? el.play() : el.pause();
              }}
              className="max-h-full w-full object-contain"
            />

            {/* action rail */}
            {signedIn && (
              <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-5">
                <LikeButton
                  videoId={v.id}
                  initialLiked={v.liked}
                  initialCount={v.likeCount}
                  variant="rail"
                />
                {!v.isOwn && (
                  <TipButton
                    target={{ videoId: v.id }}
                    variant="rail"
                    initialTotal={v.emberCount}
                  />
                )}
                {!v.isOwn && (
                  <FollowButton
                    creatorId={v.creatorId}
                    initialFollowing={v.following}
                    variant="rail"
                  />
                )}
              </div>
            )}

            {/* caption */}
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-5 pb-8">
              <Link
                href={`/v/${v.id}`}
                className="text-sm font-semibold text-ink hover:underline"
              >
                @{v.handle}
              </Link>
              <p className="mt-1 line-clamp-2 text-sm text-ink-dim">{v.title}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
