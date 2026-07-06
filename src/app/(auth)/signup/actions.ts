"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPlatformSettings } from "@/lib/clips";

const SignupSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." }),
  inviteCode: z.string().trim().optional(),
});

export type SignupState =
  | {
      errors?: { email?: string[]; password?: string[] };
      message?: string;
      confirmEmailSent?: boolean;
    }
  | undefined;

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const validated = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { email, password, inviteCode } = validated.data;

  const supabase = await createClient();

  // Closed beta: signup requires a valid invite code. beta_mode is read
  // server-side so a hidden client field can't bypass it.
  const { beta_mode } = await getPlatformSettings(supabase);
  if (beta_mode) {
    if (!inviteCode) {
      return { message: "Ember is in closed beta — you need an invite code to join." };
    }
    const { data: valid } = await supabase.rpc("invite_code_valid", {
      p_code: inviteCode,
    });
    if (!valid) {
      return { message: "That invite code isn't valid or has been used up." };
    }
  }

  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) {
    return { message: error.message };
  }

  // Consume the code only once the account was actually created.
  if (beta_mode && inviteCode) {
    await supabase.rpc("redeem_invite_code", { p_code: inviteCode });
  }

  return { confirmEmailSent: true };
}
