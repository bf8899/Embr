"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// First-party page/session tracking. Generates a session id (kept in
// localStorage with a 30-minute sliding window), sends a pageview on every
// route change, and a heartbeat every 60s while the tab is visible so session
// length is measurable. All best-effort with keepalive so it never blocks
// navigation; geo is added server-side in /api/track.

const KEY = "ember_sid";
const TTL_MS = 30 * 60 * 1000;

function getSessionId(): string {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const { id, ts } = JSON.parse(raw) as { id: string; ts: number };
      if (id && Date.now() - ts < TTL_MS) {
        localStorage.setItem(KEY, JSON.stringify({ id, ts: Date.now() }));
        return id;
      }
    }
  } catch {
    /* ignore */
  }
  const id =
    (crypto.randomUUID?.() ?? String(Math.random()).slice(2)).replace(/-/g, "") +
    Date.now().toString(36);
  const sid = id.slice(0, 48);
  try {
    localStorage.setItem(KEY, JSON.stringify({ id: sid, ts: Date.now() }));
  } catch {
    /* ignore */
  }
  return sid;
}

function send(eventType: "pageview" | "heartbeat", path: string) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), event_type: eventType, path }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const path = useRef(pathname);
  path.current = pathname;

  // pageview on each route change
  useEffect(() => {
    send("pageview", pathname);
  }, [pathname]);

  // heartbeat every 60s while visible
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") send("heartbeat", path.current);
    };
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  return null;
}
