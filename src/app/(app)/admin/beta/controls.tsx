"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setBetaMode, createInviteCode, revokeInviteCode } from "./actions";

export function BetaModeToggle({ on }: { on: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink">
          Closed beta is{" "}
          <span className={on ? "text-ember-1" : "text-ink-dim"}>
            {on ? "ON — invite code required to sign up" : "off — signups open to anyone"}
          </span>
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setErr(null);
              const res = await setBetaMode(!on);
              if ("error" in res) setErr(res.error);
            })
          }
          className="rounded-full border border-line px-3 py-1 text-xs text-ink-dim transition hover:text-ink disabled:opacity-60"
        >
          {on ? "Open signups" : "Start closed beta"}
        </button>
      </div>
      {err && <p className="text-xs text-ember-3">{err}</p>}
    </div>
  );
}

export function CreateInviteForm() {
  const [note, setNote] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [created, setCreated] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1.5 block text-xs text-ink-dim">Note (who it&apos;s for)</label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} disabled={pending} />
        </div>
        <div className="w-24">
          <label className="mb-1.5 block text-xs text-ink-dim">Max uses</label>
          <Input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            disabled={pending}
          />
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setErr(null);
              setCreated(null);
              const res = await createInviteCode({ note, maxUses: Number(maxUses) });
              if ("error" in res) setErr(res.error);
              else {
                setCreated(res.code);
                setNote("");
              }
            })
          }
        >
          Generate
        </Button>
      </div>
      {created && (
        <p className="text-xs text-ink">
          New code:{" "}
          <span className="rounded bg-pane-2 px-1.5 py-0.5 font-mono text-ember-1">{created}</span>{" "}
          — copy it now.
        </p>
      )}
      {err && <p className="text-xs text-ember-3">{err}</p>}
    </div>
  );
}

export function RevokeButton({ code }: { code: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr(null);
            const res = await revokeInviteCode(code);
            if ("error" in res) setErr(res.error);
          })
        }
        className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-dim hover:text-ember-3 disabled:opacity-60"
      >
        Revoke
      </button>
      {err && <span className="text-xs text-ember-3">{err}</span>}
    </span>
  );
}
