import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { getPlatformSettings, effectiveClipCap } from "@/lib/clips";
import { ProfileForm } from "./form";
import { ClipRequestForm } from "./clip-request-form";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const isCreator = profile.role !== "viewer";

  const supabase = await createClient();
  let cap = 0;
  let hasPending = false;
  if (isCreator) {
    const [settings, pendingRes] = await Promise.all([
      getPlatformSettings(supabase),
      supabase
        .from("clip_length_requests")
        .select("id")
        .eq("creator_id", profile.id)
        .eq("status", "pending")
        .maybeSingle(),
    ]);
    cap = effectiveClipCap(profile, settings);
    hasPending = !!pendingRes.data;
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-bold">Your profile</h1>
      <p className="mt-1 text-sm text-ink-dim">{profile.email}</p>
      <ProfileForm profile={profile} />
      {isCreator && <ClipRequestForm currentCap={cap} hasPending={hasPending} />}
    </div>
  );
}
