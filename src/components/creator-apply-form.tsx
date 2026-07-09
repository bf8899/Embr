"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PLATFORMS = [
  ["youtube", "YouTube"],
  ["tiktok", "TikTok"],
  ["instagram", "Instagram"],
  ["twitch", "Twitch"],
  ["x", "X / Twitter"],
  ["other", "Other"],
];

const field =
  "w-full rounded-xl border border-[rgba(245,158,11,.2)] bg-[#0B0908] px-4 py-3 text-[15px] text-[#F5F1EA] placeholder:text-[#6b6358] outline-none focus:border-[#F59E0B]";
const label =
  "mb-1.5 block font-[family-name:var(--font-spline-mono)] text-[11px] uppercase tracking-[2px] text-[#B8B0A4]";

export function CreatorApplyForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    setPending(true);
    const { data, error } = await createClient().rpc("submit_creator_request", {
      p_name: String(f.get("name") ?? ""),
      p_email: String(f.get("email") ?? ""),
      p_platform: String(f.get("platform") ?? ""),
      p_channel_url: String(f.get("channel_url") ?? ""),
      p_follower_count: Number(f.get("follower_count") ?? 0) || 0,
      p_about: String(f.get("about") ?? ""),
    });
    setPending(false);
    if (error) {
      setError(
        /invalid input/i.test(error.message)
          ? "Please check your name, email, and channel link."
          : "Something went wrong — please try again."
      );
      return;
    }
    setCode(data as string);
  }

  if (code) {
    return (
      <div className="rounded-2xl border border-[rgba(245,158,11,.25)] bg-[#151009] p-7 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[rgba(245,158,11,.12)]">
          <svg viewBox="0 0 100 130" className="h-6 w-6">
            <path d="M50 8 C34 34 24 52 24 70 C24 92 36 106 50 106 C64 106 76 92 76 70 C76 52 66 34 50 8 Z" fill="#F59E0B" />
            <path d="M50 52 C43 66 40 75 40 84 C40 95 44 101 50 101 C56 101 60 95 60 84 C60 75 57 66 50 52 Z" fill="#FDE68A" />
          </svg>
        </div>
        <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[#F5F1EA]">
          You&apos;re on the list
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[#B8B0A4]">
          One quick step to prove the channel is yours. Add this code anywhere in
          your channel&apos;s bio or a video description:
        </p>
        <div className="mx-auto mt-4 max-w-xs rounded-xl border border-[rgba(245,158,11,.3)] bg-[#0B0908] px-4 py-3 font-[family-name:var(--font-spline-mono)] text-lg tracking-wide text-[#FDE68A]">
          {code}
        </div>
        <p className="mx-auto mt-4 max-w-sm text-xs text-[#8b8377]">
          Leave it up until we confirm it (usually within a day or two). Once
          verified, we&apos;ll email your early-access invite. You can remove the
          code afterwards.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="cr-name">Name</label>
          <input id="cr-name" name="name" required placeholder="Your name" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="cr-email">Email</label>
          <input id="cr-email" name="email" type="email" required placeholder="you@email.com" className={field} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <div>
          <label className={label} htmlFor="cr-platform">Platform</label>
          <select id="cr-platform" name="platform" required className={field} defaultValue="youtube">
            {PLATFORMS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="cr-url">Channel / profile link</label>
          <input id="cr-url" name="channel_url" required placeholder="https://youtube.com/@you" className={field} />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="cr-followers">Follower / subscriber count</label>
        <input id="cr-followers" name="follower_count" type="number" min={0} placeholder="e.g. 12000" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="cr-about">What do you make?</label>
        <textarea id="cr-about" name="about" rows={3} maxLength={1000} placeholder="A sentence or two about your videos." className={field} />
      </div>
      {error && <p className="text-sm text-[#EA580C]">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 justify-self-start rounded-full bg-[linear-gradient(100deg,#FDE68A,#F59E0B_40%,#EA580C)] px-8 py-3.5 font-[family-name:var(--font-syne)] text-[16px] font-bold text-[#050403] shadow-[0_0_34px_rgba(245,158,11,.35)] transition hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Request early access"}
      </button>
    </form>
  );
}
