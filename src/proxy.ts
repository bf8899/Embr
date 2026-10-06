import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

// app-ads.txt must be readable by Google's AdMob crawler without signing in
// (the native app's backup ads, 2026-10-06), so the proxy never touches it.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|app-ads\\.txt$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
