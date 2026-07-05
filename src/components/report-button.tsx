"use client";

import { useState, useTransition } from "react";
import type { ReportTarget } from "@/lib/supabase/models";
import { submitReport } from "@/app/(app)/v/[id]/actions";

const REASONS = [
  "Spam or scam",
  "Harassment or hate",
  "Sexual content",
  "Violence or harm",
  "Misinformation",
  "Other",
];

export function ReportButton({
  targetType,
  targetId,
  label = "Report",
  className,
}: {
  targetType: ReportTarget;
  targetId: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const full = detail.trim() ? `${reason} — ${detail.trim()}` : reason;
    startTransition(async () => {
      const res = await submitReport({ targetType, targetId, reason: full });
      if ("error" in res) setError(res.error);
      else {
        setDone(true);
        setOpen(false);
      }
    });
  }

  if (done) return <span className="text-xs text-ink-faint">Reported ✓</span>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={className ?? "text-xs text-ink-faint transition hover:text-ink"}
      >
        {label}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-[14px] border border-line bg-pane-2 p-3 text-left shadow-xl">
          <p className="text-xs font-medium text-ink">Report this {targetType}</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-label="Reason"
            className="mt-2 w-full rounded-md border border-line bg-pane px-2 py-1.5 text-xs text-ink outline-none focus:border-ember-2"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Add detail (optional)"
            className="mt-2 w-full rounded-md border border-line bg-pane px-2 py-1.5 text-xs text-ink placeholder:text-ink-faint outline-none focus:border-ember-2"
          />
          {error && <p className="mt-1 text-xs text-ember-3">{error}</p>}
          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-dim hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded-full bg-ember-2/15 px-3 py-1 text-xs font-medium text-ember-2 hover:bg-ember-2/25 disabled:opacity-60"
            >
              {pending ? "Sending…" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
