import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";
import type { Report } from "@/lib/supabase/models";
import { ReportActions, UnsuspendButton } from "./controls";

type ReportRow = Report & { reporter: { handle: string } | null };

function when(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [s, label] of units) {
    if (secs >= s) return `${Math.floor(secs / s)}${label} ago`;
  }
  return "just now";
}

const chip =
  "rounded-full border border-line px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink-dim";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [reportsRes, suspendedRes] = await Promise.all([
    supabase
      .from("reports")
      // reports has two FKs to profiles (reporter_id, resolved_by), so the
      // embed must be pinned to the reporter relationship.
      .select("*, reporter:profiles!reports_reporter_id_fkey(handle)")
      .eq("status", "open")
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, handle, display_name")
      .eq("suspended", true)
      .order("handle"),
  ]);

  const reports = (reportsRes.data ?? []) as ReportRow[];
  const suspended = suspendedRes.data ?? [];

  // Batch-fetch previews for each target kind.
  const idsOf = (type: string) => [
    ...new Set(reports.filter((r) => r.target_type === type).map((r) => r.target_id)),
  ];
  const videoIds = idsOf("video");
  const commentIds = idsOf("comment");
  const userIds = idsOf("user");

  const [videosRes, commentsRes, usersRes] = await Promise.all([
    videoIds.length
      ? supabase.from("videos").select("id, title").in("id", videoIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    commentIds.length
      ? supabase.from("comments").select("id, body, video_id, removed").in("id", commentIds)
      : Promise.resolve({
          data: [] as { id: string; body: string; video_id: string; removed: boolean }[],
        }),
    userIds.length
      ? supabase.from("profiles").select("id, handle").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; handle: string }[] }),
  ]);

  const videos = new Map((videosRes.data ?? []).map((v) => [v.id, v]));
  const comments = new Map((commentsRes.data ?? []).map((c) => [c.id, c]));
  const users = new Map((usersRes.data ?? []).map((u) => [u.id, u]));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold">Moderation queue</h1>
      <nav className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ember-2">
        <Link href="/admin/creators" className="hover:text-ember-1">
          Creator requests
        </Link>
        <Link href="/admin/users" className="hover:text-ember-1">
          Users
        </Link>
        <Link href="/admin/clips" className="hover:text-ember-1">
          Clip-length controls
        </Link>
        <Link href="/admin/analytics" className="hover:text-ember-1">
          Analytics
        </Link>
        <Link href="/admin/audience" className="hover:text-ember-1">
          Audience
        </Link>
        <Link href="/admin/beta" className="hover:text-ember-1">
          Closed beta
        </Link>
      </nav>
      <p className="mt-2 text-sm text-ink-dim">
        {reports.length} open {reports.length === 1 ? "report" : "reports"}
      </p>

      {reports.length === 0 ? (
        <div className="mt-8 rounded-[22px] border border-dashed border-line p-12 text-center text-ink-faint">
          Nothing to review. The queue is clear.
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {reports.map((r) => {
            const video = r.target_type === "video" ? videos.get(r.target_id) : undefined;
            const comment =
              r.target_type === "comment" ? comments.get(r.target_id) : undefined;
            const user = r.target_type === "user" ? users.get(r.target_id) : undefined;

            return (
              <li key={r.id} className="rounded-[18px] border border-line bg-pane p-5">
                <div className="flex items-center gap-2">
                  <span className={chip}>{r.target_type}</span>
                  <span className="text-xs text-ink-faint">
                    reported by @{r.reporter?.handle ?? "unknown"} · {when(r.created_at)}
                  </span>
                </div>

                <div className="mt-3 rounded-[12px] border border-line bg-pane-2 p-3 text-sm">
                  {r.target_type === "video" &&
                    (video ? (
                      <Link href={`/v/${video.id}`} className="text-ink hover:text-ember-2">
                        {video.title}
                      </Link>
                    ) : (
                      <span className="text-ink-faint">Video unavailable</span>
                    ))}
                  {r.target_type === "comment" &&
                    (comment ? (
                      <div>
                        <p className="whitespace-pre-wrap text-ink-dim">{comment.body}</p>
                        <Link
                          href={`/v/${comment.video_id}`}
                          className="mt-1 inline-block text-xs text-ink-faint hover:text-ink"
                        >
                          on this video{comment.removed ? " · already removed" : ""} →
                        </Link>
                      </div>
                    ) : (
                      <span className="text-ink-faint">Comment unavailable</span>
                    ))}
                  {r.target_type === "user" && (
                    <span className="text-ink">@{user?.handle ?? "unknown user"}</span>
                  )}
                </div>

                <p className="mt-3 text-sm text-ink-dim">
                  <span className="text-ink-faint">Reason: </span>
                  {r.reason}
                </p>

                <div className="mt-4">
                  <ReportActions
                    reportId={r.id}
                    targetType={r.target_type}
                    targetId={r.target_id}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {suspended.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-lg font-bold">Suspended accounts</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {suspended.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-[14px] border border-line bg-pane px-4 py-3 text-sm"
              >
                <span className="text-ink">
                  @{u.handle}
                  {u.display_name && (
                    <span className="text-ink-faint"> · {u.display_name}</span>
                  )}
                </span>
                <UnsuspendButton userId={u.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
