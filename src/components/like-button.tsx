"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/app/(app)/v/[id]/actions";
import { formatViews } from "@/lib/format";

export function LikeButton({
  videoId,
  initialLiked,
  initialCount,
  variant = "inline",
}: {
  videoId: string;
  initialLiked: boolean;
  initialCount: number;
  variant?: "inline" | "rail";
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function onClick() {
    // Optimistic flip; reconcile from the server result.
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));

    startTransition(async () => {
      const res = await toggleLike(videoId, wasLiked);
      if ("error" in res) {
        setLiked(wasLiked);
        setCount((c) => c + (wasLiked ? 1 : -1));
      } else {
        setLiked(res.liked);
      }
    });
  }

  const heart = (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={liked ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21s-7.5-4.9-10-9.4C.6 8.9 1.9 5.5 5 5.5c2 0 3.2 1.3 4 2.4.8-1.1 2-2.4 4-2.4 3.1 0 4.4 3.4 3 6.1C19.5 16.1 12 21 12 21z" />
    </svg>
  );

  if (variant === "rail") {
    return (
      <button
        onClick={onClick}
        disabled={pending}
        aria-pressed={liked}
        className={`flex flex-col items-center gap-1 transition ${
          liked ? "text-ember-3" : "text-ink hover:text-ember-2"
        }`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-black/40 backdrop-blur">
          {heart}
        </span>
        <span className="text-xs font-medium text-ink">{formatViews(count)}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
        liked
          ? "border-ember-3/40 bg-ember-3/10 text-ember-3"
          : "border-line text-ink-dim hover:text-ink"
      }`}
    >
      {heart}
      <span>{formatViews(count)}</span>
    </button>
  );
}
