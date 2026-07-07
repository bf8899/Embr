import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/dal";
import { Landing } from "@/components/landing";

export default async function HomePage() {
  // Signed-in visitors skip the marketing page and go straight to the app.
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }
  return <Landing />;
}
