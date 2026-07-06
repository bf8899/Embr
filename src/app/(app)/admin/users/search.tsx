"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(q.trim() ? `/admin/users?q=${encodeURIComponent(q.trim())}` : "/admin/users");
  }

  return (
    <form onSubmit={submit} className="mt-4 flex gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search handle, name, or email…"
        className="flex-1 rounded-[14px] border border-line bg-pane px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-ember-2"
      />
      <button
        type="submit"
        className="rounded-full bg-[image:var(--ember-grad)] px-5 py-2 font-display text-sm font-semibold text-[#1A0A08] hover:brightness-110"
      >
        Search
      </button>
    </form>
  );
}
