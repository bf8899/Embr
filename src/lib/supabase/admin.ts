import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Service-role client: bypasses RLS. Only for trusted server-side callers that
// have already authenticated the request themselves — currently the Mux
// webhook, which verifies Mux's signature before touching the DB. Never expose
// this to the browser or use it in a path driven by user input.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
