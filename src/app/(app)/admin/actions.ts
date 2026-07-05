"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";
import type { ReportTarget } from "@/lib/supabase/models";

type ModAction = "remove_video" | "remove_comment" | "suspend" | "dismiss";

// Perform a moderation action on a report's target, then resolve the report
// (dismiss => dismissed, anything else => actioned). requireAdmin gates the
// action; the RPCs are admin-gated at the DB layer too (defense in depth).
export async function actionReport(input: {
  reportId: string;
  targetType: ReportTarget;
  targetId: string;
  action: ModAction;
}): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();
  const supabase = await createClient();

  if (input.action === "remove_video") {
    const { error } = await supabase.rpc("admin_remove_video", {
      p_video_id: input.targetId,
    });
    if (error) return { error: error.message };
  } else if (input.action === "remove_comment") {
    const { error } = await supabase.rpc("admin_remove_comment", {
      p_comment_id: input.targetId,
    });
    if (error) return { error: error.message };
  } else if (input.action === "suspend") {
    const { error } = await supabase.rpc("admin_set_suspended", {
      p_user_id: input.targetId,
      p_suspended: true,
    });
    if (error) return { error: error.message };
  }

  const { error } = await supabase.rpc("admin_resolve_report", {
    p_report_id: input.reportId,
    p_status: input.action === "dismiss" ? "dismissed" : "actioned",
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function setSuspended(
  userId: string,
  suspended: boolean
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_suspended", {
    p_user_id: userId,
    p_suspended: suspended,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
