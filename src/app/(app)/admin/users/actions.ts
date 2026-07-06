"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";

type Ok = { ok: true };
type Err = { error: string };

// Every action re-checks requireAdmin (page-level gate) and leans on the
// DB-layer admin gate in each RPC (defense in depth). Friendly-message the
// known guard failures the definer functions raise.
function friendly(msg: string): string {
  if (msg.includes("last admin")) return "You can't demote the last admin.";
  if (msg.includes("your own admin")) return "Change your own admin status from another account.";
  if (msg.includes("your own account")) return "You can't delete your own account.";
  if (msg.includes("demote this admin")) return "Demote this admin before deleting the account.";
  if (msg.includes("not authorized")) return "Not authorized.";
  if (msg.includes("invalid balance")) return "Enter a balance of 0 or more.";
  return msg;
}

export async function setSuspended(
  userId: string,
  suspended: boolean
): Promise<Ok | Err> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_suspended", {
    p_user_id: userId,
    p_suspended: suspended,
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setEmberBalance(
  userId: string,
  balance: number
): Promise<Ok | Err> {
  await requireAdmin();
  if (!Number.isInteger(balance) || balance < 0) {
    return { error: "Enter a balance of 0 or more." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_ember_balance", {
    p_user_id: userId,
    p_balance: balance,
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setAdmin(
  userId: string,
  isAdmin: boolean
): Promise<Ok | Err> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_admin", {
    p_user_id: userId,
    p_is_admin: isAdmin,
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<Ok | Err> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_user", {
    p_user_id: userId,
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/admin/users");
  return { ok: true };
}
