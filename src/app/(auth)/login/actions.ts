"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  password: z.string().min(1, { error: "Enter your password." }),
});

export type LoginState =
  | { errors?: { email?: string[]; password?: string[] }; message?: string }
  | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    return { message: error.message };
  }

  redirect("/browse");
}
