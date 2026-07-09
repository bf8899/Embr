import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/dal";
import { CreatorLanding } from "@/components/creator-landing";

// Pre-launch: the public sees the creator-recruitment landing. Signed-in users
// (admins, approved creators) go straight into the app.
export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/browse");
  }
  return <CreatorLanding />;
}
