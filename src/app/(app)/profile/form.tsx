"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Profile, ProfileRole } from "@/lib/supabase/models";

const ROLES: { value: ProfileRole; label: string }[] = [
  { value: "viewer", label: "Viewer" },
  { value: "creator", label: "Creator" },
  { value: "both", label: "Both" },
];

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [role, setRole] = useState<ProfileRole>(profile.role);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="display_name" className="mb-1.5 block text-xs text-ink-dim">
          Display name
        </label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name ?? ""}
          required
        />
        {state?.errors?.display_name && (
          <p className="mt-1 text-xs text-ember-3">{state.errors.display_name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="handle" className="mb-1.5 block text-xs text-ink-dim">
          Handle
        </label>
        <Input id="handle" name="handle" defaultValue={profile.handle} required />
        {state?.errors?.handle && (
          <p className="mt-1 text-xs text-ember-3">{state.errors.handle[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-xs text-ink-dim">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          rows={3}
          className="w-full rounded-[14px] border border-line bg-pane px-4 py-3 text-ink placeholder:text-ink-faint outline-none focus:border-ember-2"
        />
        {state?.errors?.bio && (
          <p className="mt-1 text-xs text-ember-3">{state.errors.bio[0]}</p>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-xs text-ink-dim">Role</span>
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

      {state?.message && <p className="text-xs text-ink-dim">{state.message}</p>}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
