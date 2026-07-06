"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";

type Ok = { ok: true } | { error: string };

export async function setPlatformDefault(seconds: number): Promise<Ok> {
  await requireAdmin();
  if (!Number.isInteger(seconds) || seconds <= 0) {
    return { error: "Enter a whole number of seconds." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_platform_default", {
    p_seconds: seconds,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/clips");
  return { ok: true };
}

export async function setUploadsOpen(open: boolean): Promise<Ok> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_uploads_open", { p_open: open });
  if (error) return { error: error.message };
  revalidatePath("/admin/clips");
  return { ok: true };
}

// Set (or clear, when seconds is null) an individual creator's cap by handle.
export async function setCreatorCap(
  handle: string,
  seconds: number | null
): Promise<Ok> {
  await requireAdmin();
  const cleanHandle = handle.trim().replace(/^@/, "");
  if (!cleanHandle) return { error: "Enter a creator handle." };
  if (seconds !== null && (!Number.isInteger(seconds) || seconds <= 0)) {
    return { error: "Enter a whole number of seconds, or leave blank to clear." };
  }

  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", cleanHandle)
    .maybeSingle();
  if (!creator) return { error: `No creator with handle @${cleanHandle}.` };

  const { error } = await supabase.rpc("admin_set_creator_cap", {
    p_user_id: creator.id,
    p_seconds: seconds,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/clips");
  return { ok: true };
}

export async function resolveClipRequest(input: {
  requestId: string;
  status: "approved" | "rejected";
  approvedSeconds: number | null;
  note: string;
}): Promise<Ok> {
  await requireAdmin();
  if (
    input.status === "approved" &&
    (input.approvedSeconds === null ||
      !Number.isInteger(input.approvedSeconds) ||
      input.approvedSeconds <= 0)
  ) {
    return { error: "Set the granted length (seconds) to approve." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_clip_request", {
    p_request_id: input.requestId,
    p_status: input.status,
    p_approved_seconds: input.status === "approved" ? input.approvedSeconds! : 0,
    p_note: input.note.trim(),
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/clips");
  return { ok: true };
}
