import type { MetadataRoute } from "next";

import { listProductSlugs } from "@/lib/data/catalog";
import { listPublishedPages } from "@/lib/data/cms";
import {
  collectionSitemapEntries,
  guideSitemapEntries,
  productSitemapEntries,
  SITEMAP_IDS,
  staticPageSitemapEntries,
  type SitemapId,
} from "@/lib/seo/sitemap";

// Split sitemaps (/sitemap/static.xml, /sitemap/products.xml, …), indexed by /sitemap.xml.
export function generateSitemaps() {
  return SITEMAP_IDS.map((id) => ({ id }));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  switch ((await id) as SitemapId) {
    case "static":
      return [
        ...staticPageSitemapEntries(),
        ...guideSitemapEntries(await listPublishedPages("guides/")),
      ];
    case "collections":
      return collectionSitemapEntries();
    case "products":
      // Product photos go in as image entries: Google Images is a major route to sarees.
      return productSitemapEntries(await listProductSlugs());
    default:
      return [];
  }
}
