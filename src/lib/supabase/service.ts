import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/database.types";

import { supabaseServiceRoleKey, supabaseUrl } from "./env";

/**
 * Service-role client: BYPASSES RLS. Only for trusted server paths with no user session —
 * payment webhooks, cron handlers. Never use it to render pages or in server actions that act
 * on behalf of a user.
 */
export function createServiceClient() {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
