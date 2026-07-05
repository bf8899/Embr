import { formatViews } from "@/lib/format";

export type LeaderRow = {
  sender_id: string;
  handle: string;
  display_name: string | null;
  total: number;
};

// Top tippers of a video, computed from the ledger (video_tip_leaderboard).
export function TipLeaderboard({ rows }: { rows: LeaderRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section className="mt-8 rounded-[18px] border border-line bg-pane p-5">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-ember-1" fill="currentColor" aria-hidden>
          <path d="M12 2c.4 3-1.6 4.4-2.8 5.9C8 9.4 7.2 10.8 7.2 13a4.8 4.8 0 0 0 9.6.3c0-2.2-1-3.6-2-5-.5.9-1 1.4-1.8 1.7.6-2.6-.2-5.6-1-8z" />
        </svg>
        Top emberers
      </h2>
      <ol className="mt-3 flex flex-col gap-2">
        {rows.map((r, i) => (
          <li key={r.sender_id} className="flex items-center gap-3 text-sm">
            <span className="w-4 text-center font-mono text-xs text-ink-faint">
              {i + 1}
            </span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pane-2 text-xs font-semibold text-ink-dim">
              {(r.display_name ?? r.handle).charAt(0).toUpperCase()}
            </span>
            <span className="flex-1 truncate text-ink">@{r.handle}</span>
            <span className="tabular-nums font-medium text-ember-1">
              {formatViews(r.total)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
