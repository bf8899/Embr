import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatViews } from "@/lib/format";
import type { VideoWithCreator } from "@/components/video-tile";
import { FlameMark } from "@/components/flame-mark";

type Earner = {
  id: string;
  handle: string;
  display_name: string | null;
  earned: number;
};
type Supporter = {
  id: string;
  handle: string;
  display_name: string | null;
  sent: number;
};

function Ember({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2c.4 3-1.6 4.4-2.8 5.9C8 9.4 7.2 10.8 7.2 13a4.8 4.8 0 0 0 9.6.3c0-2.2-1-3.6-2-5-.5.9-1 1.4-1.8 1.7.6-2.6-.2-5.6-1-8z" />
    </svg>
  );
}

function Rank({ i }: { i: number }) {
  const medal = ["text-ember-1", "text-ink", "text-ember-2"][i];
  return (
    <span className={`w-5 text-center font-display text-sm font-bold ${medal ?? "text-ink-faint"}`}>
      {i + 1}
    </span>
  );
}

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const [creatorsRes, supportersRes, videosRes] = await Promise.all([
    supabase.rpc("top_creators_leaderboard", { p_limit: 20 }),
    supabase.rpc("top_supporters_leaderboard", { p_limit: 20 }),
    supabase
      .from("videos")
      .select("*, profiles!videos_creator_id_fkey(handle, display_name)")
      .eq("status", "live")
      .gt("ember_count", 0)
      .order("ember_count", { ascending: false })
      .limit(10),
  ]);

  const creators = (creatorsRes.data ?? []) as Earner[];
  const supporters = (supportersRes.data ?? []) as Supporter[];
  const videos = (videosRes.data ?? []) as VideoWithCreator[];

  const empty = creators.length === 0 && supporters.length === 0 && videos.length === 0;

  return (
    <div className="mx-auto max-w-4xl">
      <section className="flex flex-col items-center pb-8 pt-1 text-center sm:pt-3">
        <FlameMark className="h-16 w-16 sm:h-20 sm:w-20" />
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
          Leaderboard
        </h1>
        <p className="mt-2 max-w-md text-sm text-ink-dim">
          The most-appreciated work on Ember — ranked by the embers the audience
          has sent.
        </p>
      </section>

      {empty ? (
        <div className="rounded-[22px] border border-dashed border-line bg-pane/40 p-12 text-center text-ink-faint">
          No embers sent yet. Be the first — hold the flame on a video you love.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top creators */}
          <section className="rounded-[22px] border border-line bg-pane p-6 md:col-span-2">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="text-ember-1"><Ember className="h-5 w-5" /></span>
              Top creators
              <span className="text-xs font-normal text-ink-faint">by embers earned</span>
            </h2>
            {creators.length === 0 ? (
              <p className="mt-4 text-sm text-ink-faint">No embers earned yet.</p>
            ) : (
              <ol className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {creators.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-3 text-sm">
                    <Rank i={i} />
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pane-2 text-xs font-semibold text-ink-dim">
                      {(c.display_name ?? c.handle).charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ink">@{c.handle}</span>
                    <span className="inline-flex items-center gap-1 tabular-nums font-semibold text-ember-1">
                      {formatViews(c.earned)}
                      <Ember className="h-3.5 w-3.5" />
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Top videos */}
          <section className="rounded-[22px] border border-line bg-pane p-6">
            <h2 className="font-display text-lg font-bold">Top videos</h2>
            {videos.length === 0 ? (
              <p className="mt-4 text-sm text-ink-faint">No tipped videos yet.</p>
            ) : (
              <ol className="mt-4 flex flex-col gap-3">
                {videos.map((v, i) => (
                  <li key={v.id} className="flex items-center gap-3 text-sm">
                    <Rank i={i} />
                    <Link href={`/v/${v.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-ink hover:text-ember-2">{v.title}</p>
                      <p className="text-xs text-ink-faint">@{v.profiles?.handle ?? "unknown"}</p>
                    </Link>
                    <span className="inline-flex items-center gap-1 shrink-0 tabular-nums font-semibold text-ember-1">
                      {formatViews(v.ember_count)}
                      <Ember className="h-3.5 w-3.5" />
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Top supporters */}
          <section className="rounded-[22px] border border-line bg-pane p-6">
            <h2 className="font-display text-lg font-bold">
              Top supporters
              <span className="ml-2 text-xs font-normal text-ink-faint">by embers sent</span>
            </h2>
            {supporters.length === 0 ? (
              <p className="mt-4 text-sm text-ink-faint">No supporters yet.</p>
            ) : (
              <ol className="mt-4 flex flex-col gap-2.5">
                {supporters.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <Rank i={i} />
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pane-2 text-xs font-semibold text-ink-dim">
                      {(s.display_name ?? s.handle).charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ink">@{s.handle}</span>
                    <span className="inline-flex items-center gap-1 tabular-nums font-semibold text-ember-1">
                      {formatViews(s.sent)}
                      <Ember className="h-3.5 w-3.5" />
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
