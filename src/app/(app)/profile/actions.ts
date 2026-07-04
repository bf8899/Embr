"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/dal";

const ProfileSchema = z.object({
  display_name: z.string().trim().min(2, { error: "At least 2 characters." }).max(50),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, { error: "At least 3 characters." })
    .max(30)
    .regex(/^[a-z0-9_]+$/, {
      error: "Lowercase letters, numbers, and underscores only.",
    }),
  role: z.enum(["viewer", "creator", "both"], { error: "Pick a role." }),
  bio: z.string().trim().max(280).optional(),
});

export type ProfileFormState =
  | {
      errors?: {
        display_name?: string[];
        handle?: string[];
        role?: string[];
        bio?: string[];
      };
      message?: string;
    }
  | undefined;

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const validated = ProfileSchema.safeParse({
    display_name: formData.get("display_name"),
    handle: formData.get("handle"),
    role: formData.get("role"),
    bio: formData.get("bio") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(validated.data)
    .eq("id", user.id);

  if (error) {
    const message =
      error.code === "23505" ? "That handle is already taken." : error.message;
    return { message };
  }

  revalidatePath("/profile");
  return { message: "Saved." };
}
