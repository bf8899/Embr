import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";
import { formatViews } from "@/lib/format";
import { AreaChart, BarChart, SplitBar } from "@/components/charts";

type Analytics = {
  audience: {
    total: number;
    viewers: number;
    creators: number;
    both: number;
    signups_7d: number;
    signups_30d: number;
  };
  engagement: {
    views: number;
    likes: number;
    comments: number;
    tips: number;
    follows: number;
    embers: number;
    watch_minutes: number;
    live_videos: number;
  };
  top_videos: {
    id: string;
    title: string;
    handle: string;
    views: number;
    likes: number;
    embers: number;
  }[];
  top_creators: {
    id: string;
    handle: string;
    display_name: string | null;
    followers: number;
    views: number;
    embers: number;
    videos: number;
  }[];
};

type Week = {
  week_start: string;
  signups: number;
  likes: number;
  comments: number;
  tips: number;
  follows: number;
};

function weekLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-pane p-5">
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-dim">{sub}</p>}
    </div>
  );
}

function Card({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-line bg-pane p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {note && <span className="text-xs text-ink-faint">{note}</span>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function AudiencePage() {
  await requireAdmin();
  const supabase = await createClient();

  const [analyticsRes, seriesRes] = await Promise.all([
    supabase.rpc("advertiser_analytics"),
    supabase.rpc("advertiser_timeseries", { p_weeks: 12 }),
  ]);

  const a = analyticsRes.data as Analytics | null;
  const weeks = (seriesRes.data ?? []) as Week[];

  if (!a) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-bold">Audience &amp; reach</h1>
        <p className="mt-4 text-sm text-ember-3">Couldn&apos;t load analytics.</p>
      </div>
    );
  }

  const interactionsTotal =
    a.engagement.likes + a.engagement.comments + a.engagement.tips + a.engagement.follows;
  const perUser = a.audience.total
    ? (interactionsTotal / a.audience.total).toFixed(1)
    : "0";

  // Real cumulative-users curve: seed with users created before the window,
  // then add each week's signups so the line ends at the true current total.
  const windowSignups = weeks.reduce((s, w) => s + w.signups, 0);
  let running = a.audience.total - windowSignups;
  const growthPoints = weeks.map((w) => {
    running += w.signups;
    return { label: weekLabel(w.week_start), value: running };
  });

  const activityPoints = weeks.map((w) => ({
    label: weekLabel(w.week_start),
    value: w.likes + w.comments + w.tips + w.follows,
  }));

  const creatorsCombined = a.audience.creators + a.audience.both;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Audience &amp; reach</h1>
        <Link href="/admin/analytics" className="text-sm text-ember-2 hover:text-ember-1">
          ← Analytics
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-dim">
        Metrics for media &amp; advertising partners.
      </p>

      {/* headline KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Total audience"
          value={formatViews(a.audience.total)}
          sub={`+${a.audience.signups_30d} in 30 days`}
        />
        <Kpi
          label="Video views"
          value={formatViews(a.engagement.views)}
          sub={`${a.engagement.live_videos} live videos`}
        />
        <Kpi
          label="Interactions"
          value={formatViews(interactionsTotal)}
          sub={`${perUser} per user`}
        />
        <Kpi
          label="Watch time"
          value={`${formatViews(a.engagement.watch_minutes)}m`}
          sub="estimated"
        />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <Card title="Audience growth" note="cumulative users">
          <AreaChart points={growthPoints} />
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Audience mix">
            <SplitBar
              segments={[
                { label: "Viewers", value: a.audience.viewers },
                { label: "Creators", value: creatorsCombined },
              ]}
            />
            <p className="mt-4 text-xs text-ink-faint">
              Role is self-selected at signup. &ldquo;Creators&rdquo; includes
              accounts set to both watch and create.
            </p>
          </Card>

          <Card title="Engagement">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Likes", a.engagement.likes],
                ["Comments", a.engagement.comments],
                ["Follows", a.engagement.follows],
                ["Tips", a.engagement.tips],
                ["Embers sent", a.engagement.embers],
                ["Views", a.engagement.views],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <dt className="text-ink-faint">{label}</dt>
                  <dd className="font-medium text-ink">
                    {formatViews(value as number)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <Card title="Activity trend" note="interactions / week, last 12 weeks">
          <BarChart points={activityPoints} />
          <p className="mt-3 text-xs text-ink-faint">
            Likes, comments, tips, and follows — the timestamped interactions.
            Views are a running total (not per-event), so they&apos;re shown as a
            cumulative figure above, not in this weekly trend.
          </p>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Top content">
            {a.top_videos.length === 0 ? (
              <p className="text-sm text-ink-faint">No videos yet.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {a.top_videos.map((v, i) => (
                  <li key={v.id} className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-ink-faint">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-ink">{v.title}</p>
                      <p className="text-xs text-ink-faint">@{v.handle}</p>
                    </div>
                    <span className="shrink-0 text-ink-dim">
                      {formatViews(v.views)} views · {formatViews(v.likes)} ♥
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="Top creators">
            {a.top_creators.length === 0 ? (
              <p className="text-sm text-ink-faint">No creators yet.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {a.top_creators.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-ink-faint">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-ink">
                        @{c.handle}
                        {c.display_name && (
                          <span className="text-ink-faint"> · {c.display_name}</span>
                        )}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {formatViews(c.videos)} video{c.videos === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="shrink-0 text-ink-dim">
                      {formatViews(c.followers)} followers · {formatViews(c.views)} views
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
