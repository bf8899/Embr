"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { autoCheckChannel, setVerified, reviewRequest } from "./actions";

const btn = "rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50";
const ghost = `${btn} border-line text-ink-dim hover:text-ink`;
const good = `${btn} border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10`;
const danger = `${btn} border-ember-3/40 text-ember-3 hover:bg-ember-3/10`;

export function CreatorRequestActions({
  id,
  channelUrl,
  code,
  verified,
  status,
  inviteCode,
}: {
  id: string;
  channelUrl: string;
  code: string;
  verified: boolean;
  status: string;
  inviteCode: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [invite, setInvite] = useState<string | null>(inviteCode);

  function run(fn: () => Promise<unknown>) {
    start(async () => {
      setMsg(null);
      await fn();
      router.refresh();
    });
  }

  if (status !== "pending") {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className={status === "approved" ? "text-emerald-400" : "text-ember-3"}>
          {status === "approved" ? "Approved" : "Rejected"}
        </span>
        {invite && (
          <span className="rounded-md border border-line bg-void px-2 py-1 font-mono text-ink-dim">
            invite: {invite}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className={ghost}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await autoCheckChannel(id, channelUrl, code);
            if ("error" in res) setMsg(res.error);
            else setMsg(res.found ? "Code found ✓" : "Code not found on the page yet.");
            router.refresh();
          })
        }
      >
        Auto-check code
      </button>
      <button
        className={verified ? ghost : good}
        disabled={pending}
        onClick={() => run(() => setVerified(id, !verified))}
      >
        {verified ? "Unverify" : "Mark verified"}
      </button>
      <button
        className={good}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await reviewRequest(id, "approved");
            if ("inviteCode" in res) setInvite(res.inviteCode);
            router.refresh();
          })
        }
      >
        Approve
      </button>
      <button
        className={danger}
        disabled={pending}
        onClick={() => run(() => reviewRequest(id, "rejected"))}
      >
        Reject
      </button>
      {msg && <span className="text-xs text-ink-faint">{msg}</span>}
    </div>
  );
}
