"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

// Google's script queues pushes on this global until adsbygoogle.js loads.
declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? "";

type Variant = "card" | "inline";

// A single display ad. Renders a real AdSense unit once NEXT_PUBLIC_ADSENSE_CLIENT
// is set; until then it shows a labeled placeholder so the placement is visible
// and testable pre-approval. Ads are only mounted where the caller decides
// (every N tiles in the grid, once on the watch page), and only when the admin
// flag is on — this component doesn't decide frequency.
export function AdSlot({ variant = "card" }: { variant?: Variant }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || pushed.current) return;
    pushed.current = true; // guard React StrictMode's double-invoke
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not ready / blocked — leave the slot empty.
    }
  }, []);

  const frame =
    variant === "card"
      ? "flex min-h-[220px] flex-col overflow-hidden rounded-[18px] border border-line bg-pane"
      : "flex min-h-[120px] flex-col overflow-hidden rounded-[18px] border border-line bg-pane";

  const label = (
    <span className="px-3 pt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint">
      Advertisement
    </span>
  );

  // No publisher id yet → placeholder so the layout is verifiable.
  if (!CLIENT) {
    return (
      <div className={frame} aria-label="Advertisement placeholder">
        {label}
        <div className="grid flex-1 place-items-center px-4 pb-4 text-center text-xs text-ink-faint">
          Ad slot — set NEXT_PUBLIC_ADSENSE_CLIENT to serve live ads here.
        </div>
      </div>
    );
  }

  return (
    <div className={frame}>
      {label}
      <Script
        id="adsbygoogle-init"
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
        crossOrigin="anonymous"
      />
      <ins
        className="adsbygoogle block flex-1"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
