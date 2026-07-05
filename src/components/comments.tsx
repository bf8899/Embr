"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postComment } from "@/app/(app)/v/[id]/actions";
import { Button } from "@/components/ui/button";

export type CommentView = {
  id: string;
  body: string;
  created_at: string;
  profiles: { handle: string; display_name: string | null } | null;
};

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [31536000, "y"],
    [2592000, "mo"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [s, label] of units) {
    if (secs >= s) return `${Math.floor(secs / s)}${label} ago`;
  }
  return "just now";
}

export function Comments({
  videoId,
  comments,
}: {
  videoId: string;
  comments: CommentView[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = new FormData(e.currentTarget).get("body");
    setError(null);
    startTransition(async () => {
      const res = await postComment({ videoId, body: String(body ?? "") });
      if ("error" in res) {
        setError(res.error);
      } else {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-bold">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      <form ref={formRef} onSubmit={onSubmit} className="mt-4 flex flex-col gap-2">
        <textarea
          name="body"
          rows={2}
          maxLength={1000}
          required
          placeholder="Add a comment…"
          className="w-full rounded-[14px] border border-line bg-pane px-4 py-3 text-ink placeholder:text-ink-faint outline-none focus:border-ember-2"
        />
        {error && <p className="text-xs text-ember-3">{error}</p>}
        <div className="self-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Posting…" : "Comment"}
          </Button>
        </div>
      </form>

      <ul className="mt-6 flex flex-col gap-5">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pane-2 text-xs font-semibold text-ink-dim">
              {(c.profiles?.display_name ?? c.profiles?.handle ?? "?")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div>
              <p className="text-sm">
                <span className="font-medium text-ink">
                  @{c.profiles?.handle ?? "unknown"}
                </span>{" "}
                <span className="text-ink-faint">{timeAgo(c.created_at)}</span>
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-dim">
                {c.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
