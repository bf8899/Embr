"use client";

import { useState, useTransition } from "react";
import type { ReportTarget } from "@/lib/supabase/models";
import { actionReport, setSuspended } from "./actions";

const danger =
  "rounded-full border border-ember-3/40 px-3 py-1 text-xs font-medium text-ember-3 transition hover:bg-ember-3/10 disabled:opacity-60";
const ghost =
  "rounded-full border border-line px-3 py-1 text-xs text-ink-dim transition hover:text-ink disabled:opacity-60";

export function ReportActions({
  reportId,
  targetType,
  targetId,
}: {
  reportId: string;
  targetType: ReportTarget;
  targetId: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: Parameters<typeof actionReport>[0]["action"]) =>
    start(async () => {
      setError(null);
      const res = await actionReport({ reportId, targetType, targetId, action });
      if ("error" in res) setError(res.error);
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {targetType === "video" && (
        <button onClick={() => run("remove_video")} disabled={pending} className={danger}>
          Remove video
        </button>
      )}
      {targetType === "comment" && (
        <button onClick={() => run("remove_comment")} disabled={pending} className={danger}>
          Remove comment
        </button>
      )}
      {targetType === "user" && (
        <button onClick={() => run("suspend")} disabled={pending} className={danger}>
          Suspend user
        </button>
      )}
      <button onClick={() => run("dismiss")} disabled={pending} className={ghost}>
        Dismiss
      </button>
      {error && <span className="text-xs text-ember-3">{error}</span>}
    </div>
  );
}

export function UnsuspendButton({ userId }: { userId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      <button
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await setSuspended(userId, false);
            if ("error" in res) setError(res.error);
          })
        }
        disabled={pending}
        className={ghost}
      >
        Unsuspend
      </button>
      {error && <span className="text-xs text-ember-3">{error}</span>}
    </span>
  );
}
