import { requireProfile } from "@/lib/supabase/dal";
import { ProfileForm } from "./form";

export default async function ProfilePage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-bold">Your profile</h1>
      <p className="mt-1 text-sm text-ink-dim">{profile.email}</p>
      <ProfileForm profile={profile} />
    </div>
  );
}
