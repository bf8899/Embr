import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { OnboardingForm } from "./form";

export default async function OnboardingPage() {
  const profile = await requireProfile();

  if (profile.onboarded) {
    redirect("/browse");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[22px] border border-line bg-pane p-8">
        <h1 className="font-display text-xl font-bold">Set up your profile</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Tell us who you are and how you plan to use Ember.
        </p>
        <OnboardingForm defaultHandle={profile.handle} />
      </div>
    </div>
  );
}
