"use client";

import { useActionState, useState } from "react";
import { completeOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProfileRole } from "@/lib/supabase/models";

const ROLES: { value: ProfileRole; label: string }[] = [
  { value: "viewer", label: "I want to watch" },
  { value: "creator", label: "I want to create" },
  { value: "both", label: "Both" },
];

export function OnboardingForm({ defaultHandle }: { defaultHandle: string }) {
  const [state, action, pending] = useActionState(completeOnboarding, undefined);
  const [role, setRole] = useState<ProfileRole>("viewer");

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="display_name" className="mb-1.5 block text-xs text-ink-dim">
          Display name
        </label>
        <Input id="display_name" name="display_name" placeholder="Your name" required />
        {state?.errors?.display_name && (
          <p className="mt-1 text-xs text-ember-3">{state.errors.display_name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="handle" className="mb-1.5 block text-xs text-ink-dim">
          Handle
        </label>
        <Input id="handle" name="handle" defaultValue={defaultHandle} required />
        {state?.errors?.handle && (
          <p className="mt-1 text-xs text-ember-3">{state.errors.handle[0]}</p>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-xs text-ink-dim">I am a…</span>
        <input type="hidden" name="role" value={role} />
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button
              type="button"
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`flex-1 rounded-full border px-3 py-2 text-sm transition ${
                role === r.value
                  ? "border-transparent bg-[image:var(--ember-grad)] text-[#1A0A08] font-semibold"
                  : "border-line text-ink-dim hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {state?.errors?.role && (
          <p className="mt-1 text-xs text-ember-3">{state.errors.role[0]}</p>
        )}
      </div>

      {state?.message && <p className="text-xs text-ember-3">{state.message}</p>}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
