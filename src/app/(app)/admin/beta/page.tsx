import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";
import type { BetaInviteCode } from "@/lib/supabase/models";
import { BetaModeToggle, CreateInviteForm, RevokeButton } from "./controls";

export default async function AdminBetaPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [settingsRes, codesRes] = await Promise.all([
    supabase.from("platform_settings").select("beta_mode").eq("id", 1).maybeSingle(),
    supabase
      .from("beta_invite_codes")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const betaMode = settingsRes.data?.beta_mode ?? false;
  const codes = (codesRes.data ?? []) as BetaInviteCode[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Closed beta</h1>
        <Link href="/admin" className="text-sm text-ink-dim hover:text-ink">
          ← Moderation queue
        </Link>
      </div>

      <section className="mt-6 rounded-[18px] border border-line bg-pane p-5">
        <h2 className="font-display text-sm font-bold">Beta gate</h2>
        <p className="mt-1 text-xs text-ink-faint">
          While on, new signups need a valid invite code. Existing accounts are
          unaffected.
        </p>
        <div className="mt-3">
          <BetaModeToggle on={betaMode} />
        </div>
      </section>

      <section className="mt-4 rounded-[18px] border border-line bg-pane p-5">
        <h2 className="font-display text-sm font-bold">Generate an invite</h2>
        <p className="mt-1 text-xs text-ink-faint">
          Hand these to people from your waitlist. A code works until its uses run
          out or you revoke it.
        </p>
        <div className="mt-3">
          <CreateInviteForm />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">
          Invite codes
          <span className="ml-2 text-sm font-normal text-ink-faint">{codes.length}</span>
        </h2>

        {codes.length === 0 ? (
          <div className="mt-4 rounded-[18px] border border-dashed border-line p-10 text-center text-ink-faint">
            No invite codes yet.
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {codes.map((c) => {
              const exhausted = c.used_count >= c.max_uses;
              const dead = c.revoked || exhausted;
              return (
                <li
                  key={c.code}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-line bg-pane px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono ${dead ? "text-ink-faint line-through" : "text-ember-1"}`}
                    >
                      {c.code}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {c.used_count}/{c.max_uses} used
                      {c.note ? ` · ${c.note}` : ""}
                      {c.revoked ? " · revoked" : exhausted ? " · used up" : ""}
                    </span>
                  </div>
                  {!dead && <RevokeButton code={c.code} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
