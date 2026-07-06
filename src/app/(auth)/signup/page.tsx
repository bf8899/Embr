import { createClient } from "@/lib/supabase/server";
import { getPlatformSettings } from "@/lib/clips";
import { SignupForm } from "./form";

export default async function SignupPage() {
  const supabase = await createClient();
  const { beta_mode } = await getPlatformSettings(supabase);
  return <SignupForm betaMode={beta_mode} />;
}
