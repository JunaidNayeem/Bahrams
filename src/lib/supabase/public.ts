import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/database.types";

import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Cookie-less anon client: sees exactly what RLS exposes to the public (published catalogue,
 * CMS, approved reviews). Safe inside "use cache" because it never reads request data.
 */
export function createPublicClient() {
  return createClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
