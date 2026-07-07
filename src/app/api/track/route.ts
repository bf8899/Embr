import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Analytics ingestion. The client posts { session_id, event_type, path };
// user_id is resolved server-side inside the track_event RPC (auth.uid()), and
// country/region come from Vercel's edge IP headers here — never trusted from
// the client. Best-effort: any failure returns 204 so tracking never disrupts
// the page.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body.session_id === "string" ? body.session_id : null;
    const eventType = body.event_type === "heartbeat" ? "heartbeat" : "pageview";
    const path = typeof body.path === "string" ? body.path : null;

    if (!sessionId) return new NextResponse(null, { status: 204 });

    // Present on Vercel; absent locally (country stays null → "Unknown").
    const country = request.headers.get("x-vercel-ip-country");
    const region = request.headers.get("x-vercel-ip-country-region");

    const supabase = await createClient();
    await supabase.rpc("track_event", {
      p_session_id: sessionId,
      p_event_type: eventType,
      p_path: path ?? undefined,
      p_country: country ?? undefined,
      p_region: region ?? undefined,
    });
  } catch {
    // swallow — analytics must never break navigation
  }
  return new NextResponse(null, { status: 204 });
}
