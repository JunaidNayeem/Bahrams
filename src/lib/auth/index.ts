import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { adminUrls, loginUrl } from "@/config/routes";
import type { StaffRole } from "@/lib/domain/enums";
import { createClient } from "@/lib/supabase/server";

export interface StaffMember {
  userId: string;
  email: string;
  displayName: string;
  role: StaffRole;
}

/** The signed-in user (JWT verified), or null. Reads cookies: call inside <Suspense>. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

/** The signed-in user's active staff record, or null for shoppers and signed-out visitors. */
export const getStaff = cache(async (): Promise<StaffMember | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_members")
    .select("user_id, email, display_name, role")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  return data
    ? { userId: data.user_id, email: data.email, displayName: data.display_name, role: data.role }
    : null;
});

/**
 * Gate for admin pages and server actions. Redirects signed-out users to the admin login and
 * staff without one of `roles` to the dashboard. RLS still enforces the same rules in Postgres.
 */
export async function requireStaff(...roles: StaffRole[]): Promise<StaffMember> {
  const staff = await getStaff();
  if (!staff) redirect(adminUrls.login);
  if (roles.length > 0 && !roles.includes(staff.role)) redirect(adminUrls.dashboard);
  return staff;
}

/** Gate for /account pages: redirects to the shopper login, returning here afterwards. */
export async function requireCustomer(next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(next));
  return user;
}
