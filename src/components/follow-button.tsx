"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/(app)/v/[id]/actions";

export function FollowButton({
  creatorId,
  initialFollowing,
  variant = "inline",
}: {
  creatorId: string;
  initialFollowing: boolean;
  variant?: "inline" | "rail";
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function onClick() {
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    startTransition(async () => {
      const res = await toggleFollow(creatorId, wasFollowing);
      if ("error" in res) setFollowing(wasFollowing);
      else setFollowing(res.following);
    });
  }

  if (variant === "rail") {
    return (
      <button
        onClick={onClick}
        disabled={pending}
        aria-pressed={following}
        className="flex flex-col items-center gap-1 text-ink transition hover:text-ember-2"
      >
        <span
          className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur ${
            following ? "bg-ember-2/30" : "bg-black/40"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {following ? (
              <path d="M20 6 9 17l-5-5" />
            ) : (
              <>
                <path d="M12 5v14M5 12h14" />
              </>
            )}
          </svg>
        </span>
        <span className="text-xs font-medium">
          {following ? "Following" : "Follow"}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      aria-pressed={following}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        following
          ? "border border-line text-ink-dim hover:text-ink"
          : "bg-[image:var(--ember-grad)] text-[#1A0A08] hover:brightness-110"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
