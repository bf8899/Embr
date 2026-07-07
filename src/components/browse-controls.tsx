import Link from "next/link";

type Params = { q?: string; tag?: string; sort?: string };

// Merge current params with overrides (undefined clears a key) into a browse href.
function href(base: Params, override: Params): string {
  const merged = { ...base, ...override };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

const seg = "rounded-full px-4 py-1.5 transition";
const segOn = `${seg} bg-pane-2 font-medium text-ink`;
const segOff = `${seg} text-ink-dim hover:text-ink`;

export function BrowseControls({
  q,
  tag,
  sort,
  tags,
}: Params & { tags: string[] }) {
  const base: Params = { q, tag, sort };
  const forYou = sort !== "newest";

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <form
          action="/"
          method="get"
          className="min-w-[200px] flex-1 sm:max-w-sm"
        >
          {tag && <input type="hidden" name="tag" value={tag} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search videos…"
            aria-label="Search videos"
            className="w-full rounded-full border border-line bg-pane px-4 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-ember-2"
          />
        </form>

        <div className="flex rounded-full border border-line p-0.5 text-sm">
          <Link href={href(base, { sort: undefined })} className={forYou ? segOn : segOff}>
            For you
          </Link>
          <Link href={href(base, { sort: "newest" })} className={forYou ? segOff : segOn}>
            Newest
          </Link>
        </div>
      </div>

      {(tags.length > 0 || tag) && (
        <div className="flex flex-wrap items-center gap-2">
          {tag && (
            <Link
              href={href(base, { tag: undefined })}
              className="inline-flex items-center gap-1 rounded-full border border-ember-2/40 bg-ember-2/10 px-3 py-1 text-xs text-ember-2"
            >
              #{tag}
              <span aria-hidden>✕</span>
              <span className="sr-only">Clear tag filter</span>
            </Link>
          )}
          {tags
            .filter((t) => t !== tag)
            .map((t) => (
              <Link
                key={t}
                href={href(base, { tag: t })}
                className="rounded-full border border-line px-3 py-1 text-xs text-ink-dim transition hover:text-ink"
              >
                #{t}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
