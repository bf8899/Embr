import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Content-first: browse/watch/flow and the marketing page are public. Only
// these prefixes require a session — everything else (incl. "/", "/v/*",
// "/flow", "/welcome", "/api/track") is open to anonymous visitors.
const GATED_PREFIXES = ["/profile", "/upload", "/onboarding", "/admin"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run other code between createServerClient and getClaims().
  // Refreshes the session if expired, required for Server Components.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const path = request.nextUrl.pathname;
  const isGated = GATED_PREFIXES.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  if (!claims && isGated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (claims && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
