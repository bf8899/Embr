import "server-only";
import Mux from "@mux/mux-node";

// Server-side Mux client + helpers. Kept behind a lazy getter so importing this
// module never throws at build time when the credentials aren't set (e.g. the
// storage-only path); it only demands them when Mux is actually invoked.
let client: Mux | null = null;

function mux(): Mux {
  if (client) return client;
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error("Mux credentials are not configured.");
  }
  client = new Mux({ tokenId, tokenSecret });
  return client;
}

export function muxConfigured(): boolean {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

export interface MuxUpload {
  /** Client PUTs the raw file body here (single PUT, no form wrapper). */
  url: string;
  /** Direct-upload id — persisted as videos.mux_upload_id to match the webhook. */
  uploadId: string;
}

/**
 * Create a one-time direct upload. `origin` locks the CORS policy to our own
 * site so the signed URL can't be reused from elsewhere. New assets are public
 * (this is a public video platform) and get a normalized MP4 static rendition
 * for broad compatibility.
 */
export async function createMuxDirectUpload(origin: string): Promise<MuxUpload> {
  const upload = await mux().video.uploads.create({
    cors_origin: origin,
    new_asset_settings: {
      playback_policies: ["public"],
      video_quality: "basic",
    },
  });
  if (!upload.url) throw new Error("Mux did not return an upload URL.");
  return { url: upload.url, uploadId: upload.id };
}

/** HLS stream URL for a Mux playback id (fed to <MuxPlayer>/native players). */
export function muxPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

/** Auto-generated poster frame for a Mux playback id. */
export function muxThumbnailUrl(playbackId: string): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&fit_mode=preserve`;
}

/**
 * Verify a webhook signature and parse the event. Throws if the signature is
 * invalid or the secret is unset — the route treats a throw as "reject".
 */
export async function unwrapMuxWebhook(
  body: string,
  headers: Headers
): Promise<Mux.Webhooks.UnwrapWebhookEvent> {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) throw new Error("MUX_WEBHOOK_SECRET is not configured.");
  // mux-node's HeadersLike accepts a WHATWG Headers object directly.
  return mux().webhooks.unwrap(body, headers, secret);
}
