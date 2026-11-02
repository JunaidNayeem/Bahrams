import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/db/database.types";

import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Refreshes the Supabase session cookie and returns the response to send plus the user (if any).
 * The response must be returned as-is (or have its cookies copied) or the session is lost.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims() verifies the JWT; do not run code between client creation and this call.
  const { data } = await supabase.auth.getClaims();
  return { response, userId: (data?.claims.sub as string | undefined) ?? null };
}
