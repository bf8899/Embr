import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";
import { formatViews } from "@/lib/format";

type Analytics = {
  signups_total: number;
  signups_7d: number;
  uploads_total: number;
  uploads_7d: number;
  live_videos: number;
  views_total: number;
  watch_minutes: number;
  tips_count: number;
  embers_sent: number;
  comments_total: number;
};

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[18px] border border-line bg-pane p-5">
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-dim">{sub}</p>}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase.rpc("platform_analytics");
  const a = (data as Analytics | null) ?? {
    signups_total: 0,
    signups_7d: 0,
    uploads_total: 0,
    uploads_7d: 0,
    live_videos: 0,
    views_total: 0,
    watch_minutes: 0,
    tips_count: 0,
    embers_sent: 0,
    comments_total: 0,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <Link href="/admin" className="text-sm text-ink-dim hover:text-ink">
          ← Moderation queue
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-dim">Platform totals at a glance.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat
          label="Signups"
          value={formatViews(a.signups_total)}
          sub={`+${a.signups_7d} in 7 days`}
        />
        <Stat
          label="Uploads"
          value={formatViews(a.uploads_total)}
          sub={`${a.live_videos} live · +${a.uploads_7d} in 7 days`}
        />
        <Stat label="Views" value={formatViews(a.views_total)} />
        <Stat
          label="Watch time"
          value={`${formatViews(a.watch_minutes)}m`}
          sub="estimated"
        />
        <Stat
          label="Tips sent"
          value={formatViews(a.tips_count)}
          sub={`${formatViews(a.embers_sent)} embers`}
        />
        <Stat label="Comments" value={formatViews(a.comments_total)} />
      </div>
    </div>
  );
}
