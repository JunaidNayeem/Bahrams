import { connection } from "next/server";

/**
 * Liveness probe for uptime monitors and CI. With cacheComponents a GET handler that touches no
 * request data is prerendered at build time, so `connection()` defers it to request time and the
 * timestamp is always fresh.
 */
export async function GET() {
  await connection();
  return Response.json(
    { status: "ok", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
