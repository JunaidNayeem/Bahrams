import type { MetadataRoute } from "next";

import { listProductSlugs } from "@/lib/data/catalog";
import {
  collectionSitemapEntries,
  productSitemapEntries,
  SITEMAP_IDS,
  staticPageSitemapEntries,
  type SitemapId,
} from "@/lib/seo/sitemap";

// Split sitemaps (/sitemap/static.xml, /sitemap/products.xml, …), listed in robots.txt.
export function generateSitemaps() {
  return SITEMAP_IDS.map((id) => ({ id }));
}

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  switch ((await id) as SitemapId) {
    case "static":
      return staticPageSitemapEntries();
    case "collections":
      return collectionSitemapEntries();
    case "products":
      return productSitemapEntries(await listProductSlugs());
    case "articles":
      // Journal and pillar guides are listed here once published (content workstream, week 8+).
      return [];
    default:
      return [];
  }
}
