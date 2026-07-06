"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm({ betaMode }: { betaMode: boolean }) {
  const [state, action, pending] = useActionState(signup, undefined);

  if (state?.confirmEmailSent) {
    return (
      <>
        <h1 className="font-display text-xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-ink-dim">
          We sent you a confirmation link. Click it to finish setting up your account.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-xl font-bold">Sign up</h1>
      <p className="mt-1 text-sm text-ink-dim">
        {betaMode ? "Ember is in closed beta — join with your invite code." : "Create your Ember account."}
      </p>

      <form action={action} className="mt-6 flex flex-col gap-4">
        {betaMode && (
          <div>
            <label htmlFor="inviteCode" className="mb-1.5 block text-xs text-ink-dim">
              Invite code
            </label>
            <Input id="inviteCode" name="inviteCode" required placeholder="EMBER-XXXX" />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs text-ink-dim">
            Email
          </label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          {state?.errors?.email && (
            <p className="mt-1 text-xs text-ember-3">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs text-ink-dim">
            Password
          </label>
          <Input id="password" name="password" type="password" required />
          {state?.errors?.password && (
            <p className="mt-1 text-xs text-ember-3">{state.errors.password[0]}</p>
          )}
        </div>

        {state?.message && <p className="text-xs text-ember-3">{state.message}</p>}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-dim">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </>
  );
}
