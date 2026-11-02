import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import type { Database } from "@/lib/db/database.types";

import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Per-request client that acts as the signed-in user (RLS applies). Reads cookies, so callers
 * must sit inside <Suspense> and must not be inside "use cache". Use `createPublicClient` for
 * cacheable catalogue reads.
 */
export async function createClient() {
  // Session reads compare token expiry with the clock, so they can never be prerendered.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot set cookies; src/proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
