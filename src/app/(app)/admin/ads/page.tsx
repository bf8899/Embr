import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";
import { getPlatformSettings } from "@/lib/clips";
import { AdControls } from "./controls";

export default async function AdminAdsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const settings = await getPlatformSettings(supabase);

  const hasPublisherId = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Ads</h1>
        <Link href="/admin" className="text-sm text-ember-2 hover:text-ember-1">
          ← Moderation queue
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink-dim">
        Display ads (Google AdSense) interleaved through the feed. Revenue only
        flows once the site is public and AdSense is approved.
      </p>

      <div
        className={`mt-4 rounded-[14px] border px-4 py-3 text-sm ${
          hasPublisherId
            ? "border-emerald-500/40 text-emerald-400"
            : "border-line text-ink-faint"
        }`}
      >
        {hasPublisherId
          ? "AdSense publisher id is configured — live ads will serve when enabled."
          : "No AdSense publisher id set yet (NEXT_PUBLIC_ADSENSE_CLIENT). Slots render a placeholder until you add one."}
      </div>

      <AdControls
        initialEnabled={settings.ads_enabled}
        initialFrequency={settings.ad_frequency}
      />
    </div>
  );
}
