"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/dal";

const OnboardingSchema = z.object({
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
});

export type OnboardingState =
  | {
      errors?: {
        display_name?: string[];
        handle?: string[];
        role?: string[];
      };
      message?: string;
    }
  | undefined;

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const validated = OnboardingSchema.safeParse({
    display_name: formData.get("display_name"),
    handle: formData.get("handle"),
    role: formData.get("role"),
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
    .update({ ...validated.data, onboarded: true })
    .eq("id", user.id);

  if (error) {
    const message =
      error.code === "23505" ? "That handle is already taken." : error.message;
    return { message };
  }

  redirect("/");
}
