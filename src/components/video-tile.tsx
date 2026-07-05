import Link from "next/link";
import { formatDuration, formatViews } from "@/lib/format";
import type { Video } from "@/lib/supabase/models";

export type VideoWithCreator = Video & {
  profiles: { handle: string; display_name: string | null } | null;
};

// Deterministic hue pair per video, echoing the demo's gradient placeholder
// scenes for tiles that have no thumbnail.
function hues(id: string): [number, number] {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return [h, (h + 70) % 360];
}

export function VideoTile({ video }: { video: VideoWithCreator }) {
  const duration = formatDuration(video.duration_seconds);
  const [h1, h2] = hues(video.id);
  const processing = video.status === "processing";

  const thumb = (
    <div className="relative aspect-video overflow-hidden rounded-[12px] border border-line">
      {video.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnail_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 30% 20%, hsl(${h1} 85% 58% / .9), transparent 62%), radial-gradient(110% 100% at 70% 100%, hsl(${h2} 80% 46% / .85), transparent 66%), linear-gradient(160deg, hsl(${h1} 40% 12%), hsl(${h2} 45% 8%))`,
          }}
        />
      )}
      {duration && !processing && (
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] text-ink">
          {duration}
        </span>
      )}
      {processing && (
        <span className="absolute inset-0 grid place-items-center bg-black/50 text-xs text-ink-dim">
          Processing…
        </span>
      )}
    </div>
  );

  const meta = (
    <div className="mt-2">
      <h3 className="truncate text-sm font-medium text-ink">{video.title}</h3>
      <p className="mt-0.5 text-xs text-ink-faint">
        @{video.profiles?.handle ?? "unknown"} · {formatViews(video.view_count)}{" "}
        views
      </p>
    </div>
  );

  if (processing) {
    return (
      <div className="opacity-70">
        {thumb}
        {meta}
      </div>
    );
  }

  return (
    <Link href={`/v/${video.id}`} className="group block">
      {thumb}
      {meta}
    </Link>
  );
}
