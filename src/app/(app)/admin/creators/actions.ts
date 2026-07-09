"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";

type Err = { error: string };

// Best-effort channel-ownership check: fetch the creator's public channel page
// and see if their verification code is present (proving they control it). Works
// for pages that render server-side (e.g. YouTube); JS-only sites (some TikTok/
// IG) may block the fetch — hence the manual toggle as a fallback.
export async function autoCheckChannel(
  id: string,
  channelUrl: string,
  code: string
): Promise<{ found: boolean } | Err> {
  await requireAdmin();
  let found = false;
  try {
    const res = await fetch(channelUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
      redirect: "follow",
    });
    const html = await res.text();
    found = html.includes(code);
  } catch {
    return { error: "Couldn't reach that channel — verify manually." };
  }
  if (found) {
    const supabase = await createClient();
    await supabase.rpc("admin_set_creator_verified", { p_id: id, p_verified: true });
    revalidatePath("/admin/creators");
  }
  return { found };
}

export async function setVerified(
  id: string,
  verified: boolean
): Promise<{ ok: true } | Err> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_creator_verified", {
    p_id: id,
    p_verified: verified,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/creators");
  return { ok: true };
}

export async function reviewRequest(
  id: string,
  status: "approved" | "rejected",
  note?: string
): Promise<{ inviteCode: string | null } | Err> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_review_creator", {
    p_id: id,
    p_status: status,
    p_note: note ?? undefined,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/creators");
  return { inviteCode: (data as string) ?? null };
}
