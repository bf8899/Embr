"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";

type Ok = { ok: true } | { error: string };

// Unambiguous alphabet (no 0/O/1/I) for codes people type by hand.
function genCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `EMBER-${s}`;
}

export async function setBetaMode(on: boolean): Promise<Ok> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_beta_mode", { p_on: on });
  if (error) return { error: error.message };
  revalidatePath("/admin/beta");
  return { ok: true };
}

export async function createInviteCode(input: {
  note: string;
  maxUses: number;
}): Promise<{ ok: true; code: string } | { error: string }> {
  const admin = await requireAdmin();
  if (!Number.isInteger(input.maxUses) || input.maxUses < 1) {
    return { error: "Max uses must be a whole number ≥ 1." };
  }
  const supabase = await createClient();
  const code = genCode();
  const { error } = await supabase.from("beta_invite_codes").insert({
    code,
    note: input.note.trim() || null,
    max_uses: input.maxUses,
    created_by: admin.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/beta");
  return { ok: true, code };
}

export async function revokeInviteCode(code: string): Promise<Ok> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("beta_invite_codes")
    .update({ revoked: true })
    .eq("code", code);
  if (error) return { error: error.message };
  revalidatePath("/admin/beta");
  return { ok: true };
}
