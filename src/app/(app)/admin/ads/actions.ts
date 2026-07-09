"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";

export async function setAds(
  enabled: boolean,
  frequency: number
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();
  if (!Number.isInteger(frequency) || frequency < 3) {
    return { error: "Frequency must be a whole number of 3 or more." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_ads", {
    p_enabled: enabled,
    p_frequency: frequency,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/ads");
  return { ok: true };
}
