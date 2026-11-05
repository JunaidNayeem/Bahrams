"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { adminUrls } from "@/config/routes";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export type LoginState = { error: string | null };

/**
 * Staff sign-in with email + password. Two-factor (TOTP) is required before launch per the brief;
 * it is added on top of this in the security sprint.
 */
export async function signInStaff(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    next: form.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // One message for every failure so the form does not reveal which accounts exist.
  if (error || !data.user) return { error: "That email and password don't match a staff account." };

  const { data: staff } = await supabase
    .from("staff_members")
    .select("active")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!staff?.active) {
    await supabase.auth.signOut();
    return { error: "That email and password don't match a staff account." };
  }

  // Only same-site admin paths are honoured, so `next` cannot become an open redirect.
  const next = parsed.data.next;
  redirect(
    next && next.startsWith("/admin") && !next.startsWith("//") ? next : adminUrls.dashboard,
  );
}

export async function signOutStaff() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(adminUrls.login);
}
