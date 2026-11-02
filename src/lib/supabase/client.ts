import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/db/database.types";

import { supabaseAnonKey, supabaseUrl } from "./env";

/** Browser client for Client Components (OTP sign-in, realtime). */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
