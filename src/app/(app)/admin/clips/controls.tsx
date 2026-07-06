"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setPlatformDefault,
  setUploadsOpen,
  setCreatorCap,
  resolveClipRequest,
} from "./actions";

function useAction() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: true } | { error: string }>, okText: string) =>
    start(async () => {
      setMsg(null);
      const res = await fn();
      setMsg("error" in res ? { ok: false, text: res.error } : { ok: true, text: okText });
    });
  return { pending, msg, run };
}

function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p className={`text-xs ${msg.ok ? "text-ink-faint" : "text-ember-3"}`}>{msg.text}</p>
  );
}

export function PlatformDefaultControl({ current }: { current: number }) {
  const [value, setValue] = useState(String(current));
  const { pending, msg, run } = useAction();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="w-32">
          <label className="mb-1.5 block text-xs text-ink-dim">Seconds</label>
          <Input
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={pending}
          />
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={() => run(() => setPlatformDefault(Number(value)), "Platform default updated.")}
        >
          Save default
        </Button>
      </div>
      <Feedback msg={msg} />
    </div>
  );
}

export function UploadsOpenToggle({ open }: { open: boolean }) {
  const { pending, msg, run } = useAction();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-ink">
          Creator uploads are{" "}
          <span className={open ? "text-ember-1" : "text-ink-dim"}>
            {open ? "OPEN" : "closed (bootstrap)"}
          </span>
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setUploadsOpen(!open), "Updated.")}
          className="rounded-full border border-line px-3 py-1 text-xs text-ink-dim transition hover:text-ink disabled:opacity-60"
        >
          {open ? "Close uploads" : "Open uploads"}
        </button>
      </div>
      <Feedback msg={msg} />
    </div>
  );
}

export function CreatorCapControl() {
  const [handle, setHandle] = useState("");
  const [seconds, setSeconds] = useState("");
  const { pending, msg, run } = useAction();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-44">
          <label className="mb-1.5 block text-xs text-ink-dim">Creator handle</label>
          <Input
            placeholder="@handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="w-32">
          <label className="mb-1.5 block text-xs text-ink-dim">
            Seconds <span className="text-ink-faint">(blank = clear)</span>
          </label>
          <Input
            type="number"
            min={1}
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            disabled={pending}
          />
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => setCreatorCap(handle, seconds.trim() === "" ? null : Number(seconds)),
              seconds.trim() === "" ? "Override cleared." : "Override set."
            )
          }
        >
          Apply
        </Button>
      </div>
      <Feedback msg={msg} />
    </div>
  );
}

export function RequestActions({ requestId }: { requestId: string }) {
  const [seconds, setSeconds] = useState("");
  const [note, setNote] = useState("");
  const { pending, msg, run } = useAction();
  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-28">
          <label className="mb-1 block text-xs text-ink-dim">Grant (s)</label>
          <Input
            type="number"
            min={1}
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs text-ink-dim">Note (optional)</label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} disabled={pending} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () =>
                resolveClipRequest({
                  requestId,
                  status: "approved",
                  approvedSeconds: seconds.trim() === "" ? null : Number(seconds),
                  note,
                }),
              "Approved."
            )
          }
          className="rounded-full bg-ember-2/15 px-3 py-1 text-xs font-medium text-ember-2 hover:bg-ember-2/25 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () =>
                resolveClipRequest({
                  requestId,
                  status: "rejected",
                  approvedSeconds: null,
                  note,
                }),
              "Rejected."
            )
          }
          className="rounded-full border border-line px-3 py-1 text-xs text-ink-dim hover:text-ink disabled:opacity-60"
        >
          Reject
        </button>
        <Feedback msg={msg} />
      </div>
    </div>
  );
}
