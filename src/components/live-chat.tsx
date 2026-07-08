"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Msg = { id: number; handle: string; body: string; created_at: string };

// A collapsible left drawer with a real-time per-video chat. Anonymous viewers
// watch the chat scroll (public read); signed-in users post. Re-subscribes when
// videoId changes so it follows the active video in Flow mode.
export function LiveChat({
  videoId,
  userId,
}: {
  videoId: string;
  userId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const supabase = useRef(createClient());
  const listRef = useRef<HTMLDivElement | null>(null);

  // load history + subscribe to inserts for this video
  useEffect(() => {
    const sb = supabase.current;
    let active = true;
    setMessages([]);

    sb.from("chat_messages")
      .select("id, handle, body, created_at")
      .eq("video_id", videoId)
      .order("created_at", { ascending: true })
      .limit(80)
      .then(({ data }) => {
        if (active && data) setMessages(data as Msg[]);
      });

    const channel = sb
      .channel(`chat-${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `video_id=eq.${videoId}`,
        },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m]
          );
        }
      )
      .subscribe();

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, [videoId]);

  // keep pinned to the newest message
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || !userId) return;
    setSending(true);
    setError(null);
    const { error } = await supabase.current
      .from("chat_messages")
      .insert({ video_id: videoId, user_id: userId, body });
    setSending(false);
    if (error) {
      setError(/slow down/i.test(error.message) ? "You're chatting too fast." : "Couldn't send.");
    } else {
      setInput("");
    }
  }

  return (
    <>
      {/* toggle tab (visible when closed) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed left-0 top-1/2 z-[70] -translate-y-1/2 rounded-r-xl border border-l-0 border-line bg-pane/90 py-3 pl-2 pr-2.5 text-ink-dim backdrop-blur transition hover:text-ink"
          aria-label="Open live chat"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[80] flex w-full max-w-[340px] flex-col border-r border-line bg-pane shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="flex items-center gap-2 font-display text-sm font-bold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ember-2" />
            Live chat
          </span>
          <button
            onClick={() => setOpen(false)}
            className="text-ink-dim hover:text-ink"
            aria-label="Close chat"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <p className="mt-4 text-center text-xs text-ink-faint">
              No messages yet. Say hi 👋
            </p>
          ) : (
            messages.map((m) => (
              <p key={m.id} className="text-sm leading-snug">
                <span className="font-medium text-ember-2">@{m.handle}</span>{" "}
                <span className="text-ink-dim">{m.body}</span>
              </p>
            ))
          )}
        </div>

        <div className="border-t border-line p-3">
          {userId ? (
            <form onSubmit={submit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                placeholder="Send a message…"
                className="min-w-0 flex-1 rounded-full border border-line bg-void px-4 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-ember-2"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="shrink-0 rounded-full bg-[image:var(--ember-grad)] px-4 py-2 text-sm font-semibold text-[#1A0A08] disabled:opacity-50"
              >
                Send
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="block rounded-full border border-line px-4 py-2 text-center text-sm text-ink-dim hover:text-ink"
            >
              Log in to join the chat
            </Link>
          )}
          {error && <p className="mt-2 text-xs text-ember-3">{error}</p>}
        </div>
      </aside>
    </>
  );
}
