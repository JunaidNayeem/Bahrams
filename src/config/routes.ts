/**
 * Typed URL builders for every route in the app. Pages, links, sitemaps, JSON-LD and
 * emails must build URLs through these helpers so the canonical URL map stays in one place.
 * Rules: lowercase, hyphenated, no trailing slashes (the root is "/").
 */
import { OCCASIONS, type Fibre, type Occasion, type ProductKind } from "@/lib/domain/enums";
import { siteConfig } from "@/config/site";

/* ------------------------------------------------------------------------------------------
 * Catalogue sections and collections
 * ---------------------------------------------------------------------------------------- */

export interface CatalogueSection {
  path: string;
  label: string;
}

/** Top-level shop section for each product kind (also the breadcrumb parent of a product). */
export const CATALOGUE_SECTIONS = {
  saree: { path: "/sarees", label: "Sarees" },
  fabric: { path: "/fabric", label: "Fabric by the metre" },
  stole_dupatta: { path: "/stoles-dupattas", label: "Stoles & dupattas" },
  dress_material: { path: "/dress-material", label: "Suits & dress material" },
  kurta_fabric: { path: "/kurta-fabric", label: "Men's kurta fabric" },
  home_furnishing: { path: "/home-furnishing", label: "Home furnishing" },
} as const satisfies Record<ProductKind, CatalogueSection>;

export function sectionUrl(kind: ProductKind): string {
  return CATALOGUE_SECTIONS[kind].path;
}

export interface CollectionDefinition {
  slug: string;
  /** Display name used in menus, headings and breadcrumbs. */
  name: string;
  /** Fibre filter the collection represents; null for curated collections. */
  fibre: Fibre | null;
}

/**
 * Saree collections. Tussar and matka lead because together they are over half of the
 * Bhagalpur cluster's output (kickoff: "these two should lead the navigation").
 */
export const SAREE_COLLECTIONS = [
  { slug: "tussar-silk", name: "Tussar silk", fibre: "tussar" },
  { slug: "matka-silk", name: "Matka silk", fibre: "matka" },
  { slug: "raw-silk", name: "Raw silk", fibre: "raw_silk" },
  { slug: "ghicha-silk", name: "Ghicha silk", fibre: "ghicha" },
  { slug: "cotton-silk", name: "Cotton-silk", fibre: "cotton_silk" },
  { slug: "linen", name: "Linen", fibre: "linen" },
  { slug: "zari-bridal", name: "Zari & bridal", fibre: null },
  { slug: "bhagalpuri-silk", name: "Bhagalpuri silk", fibre: null },
  { slug: "new-arrivals", name: "New arrivals", fibre: null },
] as const satisfies readonly CollectionDefinition[];

/** Fabric-by-the-metre collections; tussar and matka lead here too. */
export const FABRIC_COLLECTIONS = [
  { slug: "tussar-silk", name: "Tussar silk", fibre: "tussar" },
  { slug: "matka-silk", name: "Matka silk", fibre: "matka" },
  { slug: "raw-silk", name: "Raw silk", fibre: "raw_silk" },
  { slug: "linen-stripe", name: "Linen stripe", fibre: "linen" },
  { slug: "cotton-silk", name: "Cotton-silk", fibre: "cotton_silk" },
  { slug: "swatches", name: "Swatches", fibre: null },
] as const satisfies readonly CollectionDefinition[];

export type SareeCollectionSlug = (typeof SAREE_COLLECTIONS)[number]["slug"];
export type FabricCollectionSlug = (typeof FABRIC_COLLECTIONS)[number]["slug"];

/** Sections that have nested collection pages (`/sarees/[collection]`, `/fabric/[collection]`). */
export type CollectionSection = "sarees" | "fabric";
export type CollectionSlug<S extends CollectionSection> = S extends "sarees"
  ? SareeCollectionSlug
  : FabricCollectionSlug;

export const COLLECTIONS_BY_SECTION = {
  sarees: SAREE_COLLECTIONS,
  fabric: FABRIC_COLLECTIONS,
} as const;

export function collectionUrl<S extends CollectionSection>(
  section: S,
  slug: CollectionSlug<S>,
): string {
  return `/${section}/${slug}`;
}

export function isSareeCollectionSlug(slug: string): slug is SareeCollectionSlug {
  return SAREE_COLLECTIONS.some((c) => c.slug === slug);
}

export function isFabricCollectionSlug(slug: string): slug is FabricCollectionSlug {
  return FABRIC_COLLECTIONS.some((c) => c.slug === slug);
}

export function findCollection(
  section: CollectionSection,
  slug: string,
): CollectionDefinition | undefined {
  return COLLECTIONS_BY_SECTION[section].find((c) => c.slug === slug);
}

/* ------------------------------------------------------------------------------------------
 * Occasions and price bands
 * ---------------------------------------------------------------------------------------- */

export const OCCASION_LABELS = {
  office: "Office",
  festive: "Festive",
  wedding: "Wedding",
  puja: "Puja",
  gifting: "Gifting",
} as const satisfies Record<Occasion, string>;

export function occasionUrl(occasion: Occasion): string {
  return `/occasion/${occasion}`;
}

export function isOccasion(value: string): value is Occasion {
  return (OCCASIONS as readonly string[]).includes(value);
}

export interface PriceBand {
  slug: string;
  label: string;
  /** Inclusive lower bound in paise (GST-inclusive selling price). */
  minPaise: number;
  /** Inclusive upper bound in paise; null means no upper bound. */
  maxPaise: number | null;
}

/** "Shop by price" bands from the brief: under ₹3,000, ₹3,000–₹7,000, ₹7,000+. */
export const PRICE_BANDS = [
  { slug: "under-3000", label: "Under ₹3,000", minPaise: 0, maxPaise: 299_999 },
  { slug: "3000-to-7000", label: "₹3,000–₹7,000", minPaise: 300_000, maxPaise: 700_000 },
  { slug: "above-7000", label: "Above ₹7,000", minPaise: 700_001, maxPaise: null },
] as const satisfies readonly PriceBand[];

export type PriceBandSlug = (typeof PRICE_BANDS)[number]["slug"];

export function priceBandUrl(band: PriceBandSlug): string {
  return `/shop/${band}`;
}

export function isPriceBandSlug(value: string): value is PriceBandSlug {
  return PRICE_BANDS.some((b) => b.slug === value);
}

/* ------------------------------------------------------------------------------------------
 * Craft content, help and legal
 * ---------------------------------------------------------------------------------------- */

/** Pillar guides from the content plan (2,000+ words each). */
export const GUIDES = [
  {
    slug: "bhagalpur-silk-guide",
    title: "The Bhagalpur Silk Guide",
    navLabel: "Bhagalpur silk guide",
  },
  {
    slug: "silk-types-explained",
    title: "Tussar, Ghicha, Matka and Raw Silk Explained",
    navLabel: "Silk types explained",
  },
  {
    slug: "how-to-verify-silk-mark",
    title: "How to Verify Silk Mark",
    navLabel: "How to verify Silk Mark",
  },
  { slug: "saree-care", title: "Saree Care", navLabel: "Care guide" },
] as const;

export type GuideSlug = (typeof GUIDES)[number]["slug"];

export function guideUrl(slug: GuideSlug): string {
  return `/guides/${slug}`;
}

export function isGuideSlug(value: string): value is GuideSlug {
  return GUIDES.some((g) => g.slug === value);
}

export const LEGAL_PAGES = [
  { slug: "terms", title: "Terms of use" },
  { slug: "privacy", title: "Privacy notice" },
  { slug: "shipping-policy", title: "Shipping policy" },
  { slug: "returns-policy", title: "Returns & exchanges policy" },
  { slug: "cancellation", title: "Cancellation policy" },
] as const;

export type LegalSlug = (typeof LEGAL_PAGES)[number]["slug"];

export function legalUrl(slug: LegalSlug): string {
  return `/legal/${slug}`;
}

export function isLegalSlug(value: string): value is LegalSlug {
  return LEGAL_PAGES.some((p) => p.slug === value);
}

export const HELP_PAGES = [
  { slug: "shipping", title: "Shipping" },
  { slug: "returns", title: "Returns & exchanges" },
  { slug: "faq", title: "FAQ" },
] as const;

export type HelpSlug = (typeof HELP_PAGES)[number]["slug"];

export function helpUrl(slug: HelpSlug): string {
  return `/help/${slug}`;
}

/* ------------------------------------------------------------------------------------------
 * Dynamic storefront routes
 * ---------------------------------------------------------------------------------------- */

function segment(value: string): string {
  if (!value) throw new Error("URL segment must not be empty");
  return encodeURIComponent(value);
}

export function productUrl(slug: string): string {
  return `/products/${segment(slug)}`;
}

export function weaverUrl(slug: string): string {
  return `/weavers/${segment(slug)}`;
}

/** Journal index when called without a slug, otherwise the article. */
export function journalUrl(slug?: string): string {
  return slug === undefined ? "/journal" : `/journal/${segment(slug)}`;
}

export function searchUrl(query?: string): string {
  const q = query?.trim();
  return q ? withQuery("/search", { q }) : "/search";
}

export function checkoutConfirmationUrl(orderNumber: string): string {
  return `/checkout/confirmation/${segment(orderNumber)}`;
}

/** Login page; `next` is a same-site path to return to after sign-in. */
export function loginUrl(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? withQuery("/login", { next })
    : "/login";
}

/** Fixed storefront paths that take no parameters. */
export const routes = {
  home: "/",
  sarees: CATALOGUE_SECTIONS.saree.path,
  fabric: CATALOGUE_SECTIONS.fabric.path,
  stolesDupattas: CATALOGUE_SECTIONS.stole_dupatta.path,
  dressMaterial: CATALOGUE_SECTIONS.dress_material.path,
  kurtaFabric: CATALOGUE_SECTIONS.kurta_fabric.path,
  homeFurnishing: CATALOGUE_SECTIONS.home_furnishing.path,
  search: "/search",
  ourStory: "/our-story",
  weavers: "/weavers",
  journal: "/journal",
  trackOrder: "/track-order",
  contact: "/contact",
  bulkEnquiries: "/bulk-enquiries",
  grievance: "/grievance",
  cart: "/cart",
  checkout: "/checkout",
  login: "/login",
} as const;

export const accountUrls = {
  home: "/account",
  orders: "/account/orders",
  order: (orderNumber: string) => `/account/orders/${segment(orderNumber)}`,
  addresses: "/account/addresses",
  wishlist: "/account/wishlist",
  privacy: "/account/privacy",
} as const;

export const adminUrls = {
  login: "/admin/login",
  dashboard: "/admin",
  products: "/admin/products",
  newProduct: "/admin/products/new",
  product: (id: string) => `/admin/products/${segment(id)}`,
  collections: "/admin/collections",
  media: "/admin/media",
  authenticity: "/admin/authenticity",
  inventory: "/admin/inventory",
  orders: "/admin/orders",
  order: (id: string) => `/admin/orders/${segment(id)}`,
  shipments: "/admin/shipments",
  returns: "/admin/returns",
  customers: "/admin/customers",
  customer: (id: string) => `/admin/customers/${segment(id)}`,
  reviews: "/admin/reviews",
  content: "/admin/content",
  promotions: "/admin/promotions",
  reports: "/admin/reports",
  grievances: "/admin/grievances",
  privacyRequests: "/admin/privacy-requests",
  settings: "/admin/settings",
  staff: "/admin/settings/staff",
  auditLog: "/admin/audit-log",
} as const;

export const apiUrls = {
  razorpayWebhook: "/api/webhooks/razorpay",
  releaseReservations: "/api/cron/release-reservations",
  nightly: "/api/cron/nightly",
} as const;

/* ------------------------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------------------- */

/** Appends query parameters, skipping undefined/empty values. Keys keep insertion order. */
export function withQuery(
  path: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Site origin without a trailing slash, from NEXT_PUBLIC_SITE_URL. */
export function siteOrigin(): string {
  return siteConfig.url.replace(/\/+$/, "");
}

/**
 * Absolute URL for a site path (keeps any query string). Already-absolute URLs pass through.
 * The root resolves to the bare origin so canonicals never carry a trailing slash.
 */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalised = path.startsWith("/") ? path : `/${path}`;
  if (normalised === "/") return siteOrigin();
  const [pathname, ...rest] = normalised.split("?");
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const query = rest.length ? `?${rest.join("?")}` : "";
  return trimmed === "/" ? `${siteOrigin()}${query}` : `${siteOrigin()}${trimmed}${query}`;
}
