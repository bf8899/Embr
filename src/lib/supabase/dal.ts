import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/models";

// getUser() (not getSession()) verifies the JWT against the Auth server on
// every call, so it's safe to use for authorization decisions.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const requireProfile = cache(async (): Promise<Profile> => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return profile;
});

export const requireAdmin = cache(async (): Promise<Profile> => {
  const profile = await requireProfile();
  if (!profile.is_admin) {
    redirect("/dashboard");
  }
  return profile;
});
