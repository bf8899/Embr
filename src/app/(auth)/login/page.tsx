"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <>
      <h1 className="font-display text-xl font-bold">Log in</h1>
      <p className="mt-1 text-sm text-ink-dim">Welcome back to Ember.</p>

      <form action={action} className="mt-6 flex flex-col gap-4">
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
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-dim">
        No account yet?{" "}
        <Link href="/signup" className="text-ink underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </>
  );
}
