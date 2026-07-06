"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestClipLength } from "./request-clip";

export function ClipRequestForm({
  currentCap,
  hasPending,
}: {
  currentCap: number;
  hasPending: boolean;
}) {
  const [seconds, setSeconds] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [submitted, setSubmitted] = useState(hasPending);

  return (
    <div className="mt-10 border-t border-line pt-6">
      <h2 className="font-display text-lg font-bold">Clip length</h2>
      <p className="mt-1 text-sm text-ink-dim">
        Your clips can currently be up to{" "}
        <span className="text-ink">{currentCap} seconds</span> long.
      </p>

      {submitted ? (
        <p className="mt-3 text-sm text-ink-faint">
          You have a request pending review. We&apos;ll raise your limit if it&apos;s
          approved.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div className="w-32">
              <label className="mb-1.5 block text-xs text-ink-dim">Ask for (s)</label>
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
                start(async () => {
                  setMsg(null);
                  const res = await requestClipLength(Number(seconds));
                  if ("error" in res) setMsg({ ok: false, text: res.error });
                  else setSubmitted(true);
                })
              }
            >
              Request more
            </Button>
          </div>
          {msg && (
            <p className={`text-xs ${msg.ok ? "text-ink-faint" : "text-ember-3"}`}>
              {msg.text}
            </p>
          )}
          <p className="text-xs text-ink-faint">
            An admin reviews each request — reaching any leaderboard rank never
            grants it automatically.
          </p>
        </div>
      )}
    </div>
  );
}
