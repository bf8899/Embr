import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";

export default async function DashboardPage() {
  const profile = await requireProfile();

  if (!profile.onboarded) {
    redirect("/onboarding");
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">
        Welcome, {profile.display_name}
      </h1>
      <p className="mt-1 text-sm text-ink-dim">
        You&apos;re signed up as a{" "}
        <span className="text-ink">
          {profile.role === "both" ? "viewer and creator" : profile.role}
        </span>
        .
      </p>

      <div className="mt-10 rounded-[22px] border border-dashed border-line p-12 text-center text-ink-faint">
        Nothing here yet — video upload and playback land in the next phase.
      </div>
    </div>
  );
}
