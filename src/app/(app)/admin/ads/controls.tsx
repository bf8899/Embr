"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAds } from "./actions";

export function AdControls({
  initialEnabled,
  initialFrequency,
}: {
  initialEnabled: boolean;
  initialFrequency: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [frequency, setFrequency] = useState(String(initialFrequency));
  const [msg, setMsg] = useState<string | null>(null);

  function save() {
    start(async () => {
      setMsg(null);
      const res = await setAds(enabled, Number(frequency));
      setMsg("error" in res ? res.error : "Saved.");
      if (!("error" in res)) router.refresh();
    });
  }

  return (
    <div className="mt-6 rounded-[18px] border border-line bg-pane p-5">
      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block font-medium text-ink">Show ads</span>
          <span className="text-xs text-ink-faint">
            Master switch for display ads across the feed and watch pages.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            enabled ? "bg-[image:var(--ember-grad)]" : "bg-pane-2"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </label>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-dim">One ad every N videos</span>
          <input
            type="number"
            min={3}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-28 rounded-[12px] border border-line bg-void px-3 py-2 text-sm text-ink outline-none focus:border-ember-2"
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full bg-[image:var(--ember-grad)] px-5 py-2 text-sm font-semibold text-[#1A0A08] hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {msg && <span className="text-xs text-ink-faint">{msg}</span>}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Minimum 3, to keep the feed watchable. Applies to the browse grid; the
        watch-page slot shows whenever ads are on.
      </p>
    </div>
  );
}
