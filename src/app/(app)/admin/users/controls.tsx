"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setSuspended,
  setEmberBalance,
  sendEmbers,
  setAdmin,
  deleteUser,
} from "./actions";

export type AdminUser = {
  id: string;
  handle: string;
  display_name: string | null;
  email: string;
  role: string;
  is_admin: boolean;
  suspended: boolean;
  ember_balance: number;
  created_at: string;
  video_count: number;
};

const btn =
  "rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50";
const ghost = `${btn} border-line text-ink-dim hover:text-ink`;
const danger = `${btn} border-ember-3/40 text-ember-3 hover:bg-ember-3/10`;
const warm = `${btn} border-ember-1/40 text-ember-1 hover:bg-ember-1/10`;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UserRow({
  user,
  isSelf,
}: {
  user: AdminUser;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(String(user.ember_balance));
  const [gift, setGift] = useState("100");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function run(fn: () => Promise<{ error: string } | object>) {
    start(async () => {
      setError(null);
      const res = await fn();
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <li className="rounded-[18px] border border-line bg-pane p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">@{user.handle}</span>
            {user.display_name && (
              <span className="text-sm text-ink-faint">· {user.display_name}</span>
            )}
            {user.is_admin && (
              <span className="rounded-full bg-ember-2/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ember-2">
                admin
              </span>
            )}
            {user.suspended && (
              <span className="rounded-full bg-ember-3/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ember-3">
                suspended
              </span>
            )}
            {isSelf && (
              <span className="rounded-full border border-line px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink-faint">
                you
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            {user.email} · {user.role} · {user.video_count} video
            {user.video_count === 1 ? "" : "s"} · joined {fmtDate(user.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-ember-1">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M12 2c.4 3-1.6 4.4-2.8 5.9C8 9.4 7.2 10.8 7.2 13a4.8 4.8 0 0 0 9.6.3c0-2.2-1-3.6-2-5-.5.9-1 1.4-1.8 1.7.6-2.6-.2-5.6-1-8z" />
          </svg>
          {user.ember_balance}
        </div>
      </div>

      {/* actions — hidden for your own row to prevent self-lockout mistakes */}
      {!isSelf && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            className={ghost}
            disabled={pending}
            onClick={() => run(() => setSuspended(user.id, !user.suspended))}
          >
            {user.suspended ? "Unsuspend" : "Suspend"}
          </button>

          <button
            className={ghost}
            disabled={pending}
            onClick={() => run(() => setAdmin(user.id, !user.is_admin))}
          >
            {user.is_admin ? "Revoke admin" : "Make admin"}
          </button>

          {/* send a gift: adds to wallet + counts as earned on the leaderboard */}
          <span className="inline-flex items-center gap-1 rounded-full border border-ember-1/40 px-1.5 py-0.5">
            <input
              type="number"
              min={1}
              value={gift}
              onChange={(e) => setGift(e.target.value)}
              aria-label={`Send embers to @${user.handle}`}
              className="w-16 bg-transparent px-2 py-0.5 text-xs text-ink outline-none"
            />
            <button
              className={`${btn} border-transparent bg-[image:var(--ember-grad)] text-[#1A0A08] hover:brightness-110`}
              disabled={pending}
              onClick={() => run(() => sendEmbers(user.id, Number(gift)))}
            >
              Send embers
            </button>
          </span>

          {/* set absolute balance (corrections/resets) */}
          <span className="inline-flex items-center gap-1 rounded-full border border-line px-1.5 py-0.5">
            <input
              type="number"
              min={0}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              aria-label={`Set embers balance for @${user.handle}`}
              className="w-16 bg-transparent px-2 py-0.5 text-xs text-ink outline-none"
            />
            <button
              className={warm}
              disabled={pending}
              onClick={() => run(() => setEmberBalance(user.id, Number(balance)))}
            >
              Set
            </button>
          </span>

          {confirmDelete ? (
            <span className="inline-flex items-center gap-2">
              <button
                className={danger}
                disabled={pending}
                onClick={() => run(() => deleteUser(user.id))}
              >
                Confirm delete
              </button>
              <button
                className={ghost}
                disabled={pending}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              className={danger}
              disabled={pending}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          )}

          {error && <span className="text-xs text-ember-3">{error}</span>}
        </div>
      )}
    </li>
  );
}
