import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";
import type { ClipLengthRequest } from "@/lib/supabase/models";
import {
  PlatformDefaultControl,
  UploadsOpenToggle,
  CreatorCapControl,
  RequestActions,
} from "./controls";

type RequestRow = ClipLengthRequest & {
  creator: { handle: string; display_name: string | null } | null;
};

export default async function AdminClipsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [settingsRes, requestsRes] = await Promise.all([
    supabase
      .from("platform_settings")
      .select("default_clip_seconds, creator_uploads_open")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("clip_length_requests")
      // creator_id and reviewed_by both FK profiles, so pin the embed.
      .select("*, creator:profiles!clip_length_requests_creator_id_fkey(handle, display_name)")
      .eq("status", "pending")
      .order("requested_at", { ascending: true }),
  ]);

  const settings = settingsRes.data;
  const requests = (requestsRes.data ?? []) as RequestRow[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Clip-length controls</h1>
        <Link href="/admin" className="text-sm text-ink-dim hover:text-ink">
          ← Moderation queue
        </Link>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[18px] border border-line bg-pane p-5">
          <h2 className="font-display text-sm font-bold">Platform default</h2>
          <p className="mt-1 text-xs text-ink-faint">
            The cap every creator gets automatically, no request needed.
          </p>
          <div className="mt-3">
            <PlatformDefaultControl current={settings?.default_clip_seconds ?? 60} />
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-pane p-5">
          <h2 className="font-display text-sm font-bold">Bootstrap uploads</h2>
          <p className="mt-1 text-xs text-ink-faint">
            While closed, only admins can upload. Open when you&apos;re ready to
            invite creators.
          </p>
          <div className="mt-3">
            <UploadsOpenToggle open={settings?.creator_uploads_open ?? false} />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[18px] border border-line bg-pane p-5">
        <h2 className="font-display text-sm font-bold">Per-creator override</h2>
        <p className="mt-1 text-xs text-ink-faint">
          Set or clear one creator&apos;s personal ceiling directly — no request
          required. Clearing reverts them to the platform default.
        </p>
        <div className="mt-3">
          <CreatorCapControl />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">
          Request queue
          <span className="ml-2 text-sm font-normal text-ink-faint">
            {requests.length} pending
          </span>
        </h2>

        {requests.length === 0 ? (
          <div className="mt-4 rounded-[18px] border border-dashed border-line p-10 text-center text-ink-faint">
            No pending clip-length requests.
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {requests.map((r) => (
              <li key={r.id} className="rounded-[18px] border border-line bg-pane p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-ink">
                    @{r.creator?.handle ?? "unknown"}
                  </span>
                  <span className="text-sm text-ink-dim">
                    wants <span className="text-ink">{r.requested_seconds}s</span>
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  Context at request:{" "}
                  {r.leaderboard_rank_at_request != null
                    ? `leaderboard #${r.leaderboard_rank_at_request}`
                    : "unranked"}{" "}
                  ·{" "}
                  {r.cumulative_tips_at_request != null
                    ? `${r.cumulative_tips_at_request} embers received`
                    : "no tips yet"}
                </p>
                <RequestActions requestId={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
