import { redirect } from "next/navigation";

// The browse grid moved to the root route ("/"). Keep this path working for
// any old links/bookmarks by redirecting.
export default function DashboardRedirect() {
  redirect("/browse");
}
