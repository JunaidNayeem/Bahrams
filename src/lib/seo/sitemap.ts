/**
 * Sitemap and robots builders. The brief asks for sitemaps split by products, collections
 * and articles; static pages get their own file. Wire them up with generateSitemaps:
 *
 * @example
 * // src/app/sitemap.ts
 * import type { MetadataRoute } from "next";
 * import {
 *   SITEMAP_IDS, articleSitemapEntries, collectionSitemapEntries,
 *   productSitemapEntries, staticPageSitemapEntries, type SitemapId,
 * } from "@/lib/seo/sitemap";
 *
 * export async function generateSitemaps() {
 *   return SITEMAP_IDS.map((id) => ({ id }));
 * }
 *
 * export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
 *   const id = (await props.id) as SitemapId;
 *   switch (id) {
 *     case "products": return productSitemapEntries(await listPublishedProductsForSitemap());
 *     case "collections": return collectionSitemapEntries(await listCollectionUpdates());
 *     case "articles": return articleSitemapEntries(await listPublishedArticlesForSitemap());
 *     default: return staticPageSitemapEntries();
 *   }
 * }
 *
 * // src/app/robots.ts
 * import { buildRobots } from "@/lib/seo/sitemap";
 * export default function robots() { return buildRobots(); }
 *
 * Generated files live at /sitemap/products.xml etc.; buildRobots() lists them all.
 * Publishing in the admin should revalidate the sitemap route (revalidatePath or a cache tag).
 */
import type { MetadataRoute } from "next";
import {
  CATALOGUE_SECTIONS,
  FABRIC_COLLECTIONS,
  GUIDES,
  HELP_PAGES,
  LEGAL_PAGES,
  PRICE_BANDS,
  SAREE_COLLECTIONS,
  absoluteUrl,
  collectionUrl,
  guideUrl,
  helpUrl,
  journalUrl,
  legalUrl,
  occasionUrl,
  priceBandUrl,
  productUrl,
  routes,
  weaverUrl,
} from "@/config/routes";
import { OCCASIONS } from "@/lib/domain/enums";

export const SITEMAP_IDS = ["static", "collections", "products", "articles"] as const;
export type SitemapId = (typeof SITEMAP_IDS)[number];

type SitemapEntry = MetadataRoute.Sitemap[number];
type DateLike = Date | string;

/**
 * Next.js writes sitemap URLs into XML without escaping, so "&" in an image URL (e.g. a
 * Supabase transform query) would produce an invalid document. Escape here.
 */
export function escapeXmlUrl(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function entry(
  path: string,
  options: {
    lastModified?: DateLike | null;
    images?: readonly string[];
    changeFrequency?: SitemapEntry["changeFrequency"];
    priority?: number;
  } = {},
): SitemapEntry {
  const images = options.images?.filter(Boolean).map((src) => escapeXmlUrl(absoluteUrl(src)));
  return {
    url: escapeXmlUrl(absoluteUrl(path)),
    ...(options.lastModified ? { lastModified: options.lastModified } : {}),
    ...(options.changeFrequency ? { changeFrequency: options.changeFrequency } : {}),
    ...(options.priority !== undefined ? { priority: options.priority } : {}),
    ...(images?.length ? { images } : {}),
  };
}

/* ------------------------------------------------------------------------------------------
 * Products
 * ---------------------------------------------------------------------------------------- */

export interface SitemapProduct {
  slug: string;
  updatedAt: DateLike;
  /** Product image URLs (paths or absolute); Google reads up to 1,000 per URL. */
  images?: readonly string[];
}

/** Published, non-archived products only: the caller filters (noindex pages must not be listed). */
export function productSitemapEntries(products: readonly SitemapProduct[]): MetadataRoute.Sitemap {
  return products.map((p) =>
    entry(productUrl(p.slug), {
      lastModified: p.updatedAt,
      images: p.images,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );
}

/* ------------------------------------------------------------------------------------------
 * Collections and other listing pages
 * ---------------------------------------------------------------------------------------- */

export interface SitemapCollectionUpdate {
  path: string;
  /** Latest product or copy change on that listing. */
  updatedAt?: DateLike | null;
  /** Hero / cover image. */
  images?: readonly string[];
}

/** Every listing landing page in the URL map: sections, collections, occasions, price bands. */
export function listingPaths(): string[] {
  return [
    ...Object.values(CATALOGUE_SECTIONS).map((s) => s.path),
    ...SAREE_COLLECTIONS.map((c) => collectionUrl("sarees", c.slug)),
    ...FABRIC_COLLECTIONS.map((c) => collectionUrl("fabric", c.slug)),
    ...OCCASIONS.map(occasionUrl),
    ...PRICE_BANDS.map((b) => priceBandUrl(b.slug)),
  ];
}

/**
 * Listing pages with lastModified/images merged in from `updates` (keyed by path).
 * Pass `exclude` for sections not stocked at launch (e.g. "/home-furnishing").
 */
export function collectionSitemapEntries(
  updates: readonly SitemapCollectionUpdate[] = [],
  exclude: readonly string[] = [],
): MetadataRoute.Sitemap {
  const byPath = new Map(updates.map((u) => [u.path, u]));
  return listingPaths()
    .filter((path) => !exclude.includes(path))
    .map((path) => {
      const update = byPath.get(path);
      return entry(path, {
        lastModified: update?.updatedAt,
        images: update?.images,
        changeFrequency: "daily",
        priority: path.split("/").length === 2 ? 0.9 : 0.8,
      });
    });
}

/* ------------------------------------------------------------------------------------------
 * Articles: pillar guides, journal entries and weaver stories
 * ---------------------------------------------------------------------------------------- */

export interface SitemapArticle {
  kind: "guide" | "journal" | "weaver";
  slug: string;
  updatedAt: DateLike;
  images?: readonly string[];
}

function articlePath(article: SitemapArticle): string {
  switch (article.kind) {
    case "guide":
      return `/guides/${encodeURIComponent(article.slug)}`;
    case "journal":
      return journalUrl(article.slug);
    case "weaver":
      return weaverUrl(article.slug);
  }
}

/**
 * Guides, journal and weaver pages. Pillar guides are always listed (their routes are static);
 * a dated entry in `articles` overrides the guide's default entry.
 */
export function articleSitemapEntries(articles: readonly SitemapArticle[]): MetadataRoute.Sitemap {
  const listed = new Set(articles.filter((a) => a.kind === "guide").map((a) => a.slug));
  const guides = GUIDES.filter((g) => !listed.has(g.slug)).map((g) =>
    entry(guideUrl(g.slug), { changeFrequency: "monthly", priority: 0.7 }),
  );
  return [
    ...guides,
    ...articles.map((a) =>
      entry(articlePath(a), {
        lastModified: a.updatedAt,
        images: a.images,
        changeFrequency: "monthly",
        priority: a.kind === "guide" ? 0.7 : 0.6,
      }),
    ),
  ];
}

/* ------------------------------------------------------------------------------------------
 * Static pages
 * ---------------------------------------------------------------------------------------- */

/**
 * Indexable static pages. Excludes search, cart, checkout, account, login and track-order
 * (private or thin utility pages, served with noindex).
 */
export const STATIC_SITEMAP_PATHS: readonly string[] = [
  routes.home,
  routes.ourStory,
  routes.weavers,
  routes.journal,
  ...HELP_PAGES.map((p) => helpUrl(p.slug)),
  routes.contact,
  routes.bulkEnquiries,
  routes.grievance,
  ...LEGAL_PAGES.map((p) => legalUrl(p.slug)),
];

export function staticPageSitemapEntries(lastModified?: DateLike): MetadataRoute.Sitemap {
  return STATIC_SITEMAP_PATHS.map((path) =>
    entry(path, {
      lastModified,
      changeFrequency: path === routes.home ? "daily" : "monthly",
      priority: path === routes.home ? 1 : path.startsWith("/legal") ? 0.3 : 0.5,
    }),
  );
}

/* ------------------------------------------------------------------------------------------
 * robots.txt
 * ---------------------------------------------------------------------------------------- */

/** Absolute URLs of the split sitemaps produced by generateSitemaps (see example above). */
export function sitemapUrls(): string[] {
  return SITEMAP_IDS.map((id) => absoluteUrl(`/sitemap/${id}.xml`));
}

/**
 * Crawl everything public; keep bots out of private, transactional and internal-search URLs.
 * "/search?" blocks result pages for any query while the bare /search page stays reachable.
 * Filtered/sorted collection URLs are NOT blocked: crawlers must see their canonical/noindex.
 */
export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/cart", "/checkout", "/api", "/search?"],
    },
    sitemap: sitemapUrls(),
  };
}
