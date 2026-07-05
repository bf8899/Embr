"use client";

import { useRef, useState } from "react";
import { sendTip } from "@/app/(app)/v/[id]/actions";
import { useWallet } from "@/components/wallet";
import { TIP_AMOUNT } from "@/lib/tips";
import { formatViews } from "@/lib/format";

// How long to hold before the tip fires. Short enough that a firm press works,
// long enough to avoid accidental taps — "hold the flame" without the wait.
const HOLD_MS = 550;

type TipTarget = { videoId: string } | { commentId: string };

export function TipButton({
  target,
  variant = "inline",
  initialTotal,
}: {
  target: TipTarget;
  variant?: "inline" | "rail" | "comment";
  initialTotal?: number;
}) {
  const { balance, adjustBalance, setBalance } = useWallet();
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(false);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [error, setError] = useState<string | null>(null);
  const raf = useRef<number | null>(null);
  const fired = useRef(false);

  function fire() {
    fired.current = true;
    stopRaf();
    setProgress(0);
    setSending(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 650);

    // Optimistic: spend now, reconcile to the server's authoritative balance.
    adjustBalance(-TIP_AMOUNT);
    setTotal((t) => t + TIP_AMOUNT);

    sendTip(target).then((res) => {
      setSending(false);
      if ("error" in res) {
        adjustBalance(TIP_AMOUNT);
        setTotal((t) => t - TIP_AMOUNT);
        setError(res.error);
      } else {
        setBalance(res.balance);
      }
    });
  }

  function stopRaf() {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  }

  function begin() {
    if (sending) return;
    if (balance < TIP_AMOUNT) {
      setError("You're out of embers.");
      return;
    }
    setError(null);
    fired.current = false;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / HOLD_MS);
      setProgress(p);
      if (p >= 1) fire();
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function cancel() {
    stopRaf();
    if (!fired.current) setProgress(0);
  }

  const flame = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12 2c.4 3-1.6 4.4-2.8 5.9C8 9.4 7.2 10.8 7.2 13a4.8 4.8 0 0 0 9.6.3c0-2.2-1-3.6-2-5-.5.9-1 1.4-1.8 1.7.6-2.6-.2-5.6-1-8z" />
    </svg>
  );

  // A charging ring behind the flame while the button is held.
  const ring =
    progress > 0
      ? { background: `conic-gradient(var(--ember-2) ${progress * 360}deg, transparent 0)` }
      : undefined;

  const holdProps = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      begin();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    // Keyboard fallback: hold-to-charge is awkward on a key, so fire once.
    onKeyDown: (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !sending) {
        e.preventDefault();
        if (balance < TIP_AMOUNT) setError("You're out of embers.");
        else fire();
      }
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    disabled: sending,
    "aria-label": `Hold to send ${TIP_AMOUNT} embers`,
    className: "touch-none select-none",
  };

  if (variant === "rail") {
    return (
      <button
        {...holdProps}
        className={`${holdProps.className} flex flex-col items-center gap-1 text-ink transition`}
      >
        <span
          className={`grid h-11 w-11 place-items-center rounded-full p-[3px] backdrop-blur transition ${
            flash ? "text-ember-1" : "text-ink hover:text-ember-2"
          }`}
          style={ring}
        >
          <span className="grid h-full w-full place-items-center rounded-full bg-black/40">
            {flame}
          </span>
        </span>
        <span className="text-xs font-medium">{formatViews(total)}</span>
      </button>
    );
  }

  if (variant === "comment") {
    return (
      <button
        {...holdProps}
        className={`${holdProps.className} inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition ${
          flash ? "text-ember-1" : "text-ink-faint hover:text-ember-2"
        }`}
        style={ring ? { ...ring, borderRadius: 9999 } : undefined}
      >
        <span className="h-3.5 w-3.5">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
            <path d="M12 2c.4 3-1.6 4.4-2.8 5.9C8 9.4 7.2 10.8 7.2 13a4.8 4.8 0 0 0 9.6.3c0-2.2-1-3.6-2-5-.5.9-1 1.4-1.8 1.7.6-2.6-.2-5.6-1-8z" />
          </svg>
        </span>
        {total > 0 && <span className="tabular-nums">{formatViews(total)}</span>}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        {...holdProps}
        className={`${holdProps.className} inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
          flash
            ? "border-ember-2/50 bg-ember-2/15 text-ember-1"
            : "border-ember-1/30 text-ember-1 hover:bg-ember-1/10"
        }`}
        style={ring ? { ...ring, borderRadius: 9999 } : undefined}
      >
        {flame}
        <span>Hold to ember</span>
      </button>
      {error && <span className="text-xs text-ember-3">{error}</span>}
    </div>
  );
}
