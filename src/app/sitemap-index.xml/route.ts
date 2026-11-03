import { sitemapIndexXml } from "@/lib/seo/sitemap";

/**
 * Sitemap index, served at /sitemap.xml through a rewrite in next.config.ts: the single URL
 * submitted in Search Console and listed in robots.txt. Next's generateSitemaps serves the child
 * maps at /sitemap/<id>.xml but writes no index of its own, and a route file at
 * app/sitemap.xml/ would collide with app/sitemap.ts. Static: the child maps change only on deploy.
 */
export function GET() {
  return new Response(sitemapIndexXml(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
