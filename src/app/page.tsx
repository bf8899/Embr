import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-4xl font-extrabold tracking-[0.08em]">
        <span className="bg-[image:var(--ember-grad)] bg-clip-text text-transparent">
          EMBER
        </span>
      </h1>
      <p className="mt-4 max-w-sm text-ink-dim">
        Video worth burning for. A new home for video, built on a tip economy.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/signup">
          <Button>Sign up</Button>
        </Link>
        <Link href="/login">
          <Button variant="ghost">Log in</Button>
        </Link>
      </div>
    </div>
  );
}
