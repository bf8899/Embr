import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";
import { CreatorRequestActions } from "./controls";

type Request = {
  id: string;
  name: string;
  email: string;
  platform: string;
  channel_url: string;
  follower_count: number | null;
  about: string | null;
  verification_code: string;
  verified: boolean;
  status: string;
  invite_code: string | null;
  created_at: string;
};

function when(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function AdminCreatorsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const requests = (data ?? []) as Request[];
  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Creator requests</h1>
        <Link href="/admin" className="text-sm text-ember-2 hover:text-ember-1">
          ← Moderation queue
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink-dim">
        {pending.length} awaiting review. Approving mints a single-use invite code
        to send the creator.
      </p>

      {requests.length === 0 ? (
        <div className="mt-8 rounded-[22px] border border-dashed border-line p-12 text-center text-ink-faint">
          No creator requests yet.
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {[...pending, ...reviewed].map((r) => (
            <li key={r.id} className="rounded-[18px] border border-line bg-pane p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {r.name}{" "}
                    <span className="text-sm text-ink-faint">· {r.email}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    <span className="uppercase tracking-wide">{r.platform}</span> ·{" "}
                    {r.follower_count?.toLocaleString() ?? "—"} followers · {when(r.created_at)}
                  </p>
                  <a
                    href={r.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block max-w-full truncate text-sm text-ember-2 hover:text-ember-1"
                  >
                    {r.channel_url} ↗
                  </a>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.verified && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                      verified
                    </span>
                  )}
                  <span className="rounded-md border border-line bg-void px-2 py-1 font-mono text-xs text-ink-dim">
                    {r.verification_code}
                  </span>
                </div>
              </div>

              {r.about && (
                <p className="mt-3 rounded-[12px] border border-line bg-pane-2 p-3 text-sm text-ink-dim">
                  {r.about}
                </p>
              )}

              <div className="mt-4">
                <CreatorRequestActions
                  id={r.id}
                  channelUrl={r.channel_url}
                  code={r.verification_code}
                  verified={r.verified}
                  status={r.status}
                  inviteCode={r.invite_code}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
