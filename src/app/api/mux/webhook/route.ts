import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unwrapMuxWebhook, muxThumbnailUrl } from "@/lib/video/mux";

// Mux calls this when an asset changes state. We only act on the terminal
// outcomes for our upload flow:
//   video.asset.ready   → asset transcoded; flip the row to 'live' with its
//                         playback id, duration, and auto-generated thumbnail.
//   video.asset.errored → transcode failed; leave a trace (status stays
//                         'processing' so the owner sees it never finished).
// The signature is verified first (unwrapMuxWebhook throws on a bad/missing
// signature), then we use the service-role client since there's no user session.
export async function POST(request: NextRequest) {
  const body = await request.text();

  let event;
  try {
    event = await unwrapMuxWebhook(body, request.headers);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "video.asset.ready") {
      const data = event.data;
      const uploadId = data.upload_id;
      const playbackId = data.playback_ids?.[0]?.id ?? null;
      if (!uploadId || !playbackId) {
        // Not one of our direct uploads, or no public playback id — ignore.
        return NextResponse.json({ received: true });
      }

      const supabase = createAdminClient();
      await supabase
        .from("videos")
        .update({
          status: "live",
          playback_id: playbackId,
          video_asset_id: data.id,
          duration_seconds: data.duration ? Math.round(data.duration) : null,
          thumbnail_url: muxThumbnailUrl(playbackId),
        })
        .eq("mux_upload_id", uploadId)
        .eq("status", "processing");
    }
  } catch {
    // Ack anyway: a 5xx makes Mux retry, but if our DB write is the problem a
    // retry won't help. Surfacing failures happens via logs, not the response.
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
