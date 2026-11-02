import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/**
 * Keeps the Supabase session fresh and makes an optimistic sign-in check for /admin and
 * /account. This is not authorisation: admin pages and actions call requireStaff(), and RLS
 * enforces roles in the database.
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!userId) {
    const isAdmin = pathname.startsWith("/admin") && pathname !== "/admin/login";
    const isAccount = pathname.startsWith("/account");
    if (isAdmin || isAccount) {
      const url = request.nextUrl.clone();
      url.pathname = isAdmin ? "/admin/login" : "/login";
      url.search = "";
      url.searchParams.set("next", pathname + search);
      const redirect = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
  }

  return response;
}

export const config = {
  // Session refresh is only needed where auth matters; public catalogue pages stay untouched
  // so they remain fully cacheable.
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/login", "/cart"],
};
