/**
 * Metadata helpers for generateMetadata(). Every page gets an absolute canonical, Open Graph
 * and Twitter cards and explicit robots directives from one place.
 *
 * Child segments replace (not merge) the parent's `openGraph` object in Next.js, so these
 * helpers always emit the full set (siteName, locale, images) rather than relying on the layout.
 * Return values are plain serialisable objects, so they are safe inside "use cache" functions.
 */
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl, productUrl, siteOrigin } from "@/config/routes";
import { keywordTargetFor } from "@/config/keyword-map";
import {
  DEFAULT_OG_IMAGE,
  DESCRIPTION_MAX_LENGTH,
  OG_LOCALE,
  TITLE_MAX_LENGTH,
  TITLE_SEPARATOR,
} from "./constants";

export interface SeoImage {
  /** Path or absolute URL. */
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface BuildMetadataInput {
  title: string;
  description: string;
  /** The page's own path, e.g. "/sarees/tussar-silk". */
  path: string;
  /** Canonical path or URL when it differs from `path` (see resolveCollectionIndexability). */
  canonical?: string;
  image?: SeoImage | null;
  noindex?: boolean;
  type?: "website" | "article";
  /** Append " | Bahram Silks" when it fits within 60 characters. Default true. */
  brandSuffix?: boolean;
  /** Article dates (ISO 8601) for og:article tags. */
  publishedTime?: string;
  modifiedTime?: string;
}

/* ------------------------------------------------------------------------------------------
 * Text helpers
 * ---------------------------------------------------------------------------------------- */

/** Strips tags and collapses whitespace, for descriptions built from rich text. */
export function toPlainText(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trims to at most `max` characters on a word boundary, ending with an ellipsis when cut.
 * Trailing punctuation before the ellipsis is dropped ("silk, …" reads badly).
 */
export function trimDescription(text: string, max: number = DESCRIPTION_MAX_LENGTH): string {
  const plain = toPlainText(text);
  if (plain.length <= max) return plain;
  const budget = max - 1; // room for "…"
  const cut = plain.slice(0, budget + 1);
  const lastSpace = cut.lastIndexOf(" ");
  // A single very long word: hard-cut rather than return nothing.
  const head = lastSpace > budget / 2 ? cut.slice(0, lastSpace) : plain.slice(0, budget);
  return `${head.replace(/[\s,;:.\-–—]+$/u, "")}…`;
}

/**
 * Page title with the brand suffix when it fits in 60 characters; titles that already
 * mention the brand are left alone.
 */
export function formatTitle(title: string, brandSuffix = true): string {
  const clean = toPlainText(title);
  if (!brandSuffix || clean.includes(siteConfig.name)) return clean;
  const withBrand = `${clean}${TITLE_SEPARATOR}${siteConfig.name}`;
  return withBrand.length <= TITLE_MAX_LENGTH ? withBrand : clean;
}

/** Brand line appended to short descriptions so search snippets say who and where. */
export const BRAND_CONTEXT = `From ${siteConfig.name}, the weaving house of Bhagalpur.`;
const SHORT_DESCRIPTION = 100;

/**
 * Descriptions under ~100 characters waste most of the snippet Google shows (about 155), and
 * many come from short admin-entered copy. Append the brand line when it is missing and fits.
 */
export function withBrandContext(text: string): string {
  const plain = toPlainText(text);
  if (plain.length >= SHORT_DESCRIPTION || plain.includes(siteConfig.name)) return plain;
  const joined = `${plain.replace(/\s*[.!?]?$/u, (end) => end.trim() || ".")} ${BRAND_CONTEXT}`;
  return joined.length <= DESCRIPTION_MAX_LENGTH ? joined : plain;
}

/**
 * Only the production deployment may be indexed. Vercel previews (and the *.vercel.app copy of
 * any non-production build) get noindex everywhere, so they never compete with bahramsilk.com.
 * Off Vercel (local dev, CI) the site behaves as production so tests see the real directives.
 */
export function isSiteIndexable(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL_ENV ? env.VERCEL_ENV === "production" : true;
}

/* ------------------------------------------------------------------------------------------
 * Builders
 * ---------------------------------------------------------------------------------------- */

const INDEX_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    // Large image previews matter for a visual catalogue in Google Images and Discover.
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
} as const satisfies Metadata["robots"];

const NOINDEX_ROBOTS = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
} as const satisfies Metadata["robots"];

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const title = formatTitle(input.title, input.brandSuffix ?? true);
  const description = trimDescription(withBrandContext(input.description));
  const canonical = absoluteUrl(input.canonical ?? input.path);
  const image = input.image ?? DEFAULT_OG_IMAGE;
  const ogImage = {
    url: absoluteUrl(image.url),
    alt: image.alt,
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
  };

  const openGraphBase = {
    title,
    description,
    url: canonical,
    siteName: siteConfig.name,
    locale: OG_LOCALE,
    images: [ogImage],
  };

  return {
    // Absolute so a layout title template can never double-append the brand.
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph:
      input.type === "article"
        ? {
            ...openGraphBase,
            type: "article",
            ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
            ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
          }
        : { ...openGraphBase, type: "website" },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
    robots: input.noindex || !isSiteIndexable() ? NOINDEX_ROBOTS : INDEX_ROBOTS,
  };
}

/**
 * Search-engine ownership tags, from env so codes never live in the repo. A Search Console
 * "Domain" property verified by DNS needs none of this; the meta tag suits a "URL prefix" one.
 */
export function verificationMetadata(
  env: Record<string, string | undefined> = process.env,
): Metadata["verification"] | undefined {
  const google = env.GOOGLE_SITE_VERIFICATION?.trim();
  const bing = env.BING_SITE_VERIFICATION?.trim();
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}

/** Root-layout defaults: metadataBase, a title template for pages that set plain titles. */
export function rootMetadata(): Metadata {
  const home = keywordTargetFor("/");
  const verification = verificationMetadata();
  return {
    metadataBase: new URL(siteOrigin()),
    applicationName: siteConfig.name,
    title: {
      default: home?.title ?? `${siteConfig.name}${TITLE_SEPARATOR}${siteConfig.tagline}`,
      template: `%s${TITLE_SEPARATOR}${siteConfig.name}`,
    },
    description: siteConfig.description,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: OG_LOCALE,
      images: [{ ...DEFAULT_OG_IMAGE, url: absoluteUrl(DEFAULT_OG_IMAGE.url) }],
    },
    twitter: { card: "summary_large_image" },
    robots: isSiteIndexable() ? INDEX_ROBOTS : NOINDEX_ROBOTS,
    formatDetection: { telephone: false, email: false, address: false },
    ...(verification ? { verification } : {}),
  };
}

/** Metadata for private or utility pages (cart, checkout, account, login, search, admin). */
export function noindexMetadata(title: string, path: string): Metadata {
  return {
    title: { absolute: formatTitle(title) },
    alternates: { canonical: absoluteUrl(path) },
    robots: NOINDEX_ROBOTS,
  };
}

export interface ProductMetadataInput {
  name: string;
  slug: string;
  /** Long product description (rich text allowed); used when no SEO description is set. */
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  /** e.g. "Tussar silk saree"; makes the fallback title and description specific. */
  productType?: string | null;
  image?: SeoImage | null;
  /** Archived or unpublished-preview products stay out of the index. */
  noindex?: boolean;
}

export function productMetadata(input: ProductMetadataInput): Metadata {
  const title =
    input.seoTitle ||
    (input.productType && !input.name.toLowerCase().includes(input.productType.toLowerCase())
      ? `${input.name}, ${input.productType}`
      : input.name);
  const description =
    input.seoDescription ||
    input.description ||
    `${input.name}${input.productType ? `, a ${input.productType.toLowerCase()}` : ""} woven in Bhagalpur and sold direct by ${siteConfig.name}. Fibre composition, care and delivery details on the page.`;
  return buildMetadata({
    title,
    description,
    path: productUrl(input.slug),
    image: input.image,
    noindex: input.noindex,
  });
}

export interface CollectionMetadataInput {
  path: string;
  /** Display name, used when neither admin SEO fields nor the keyword map supply a title. */
  name: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  /** Collection intro copy; fallback description when the keyword map has none. */
  intro?: string | null;
  image?: SeoImage | null;
  /** From resolveCollectionIndexability(). */
  canonical?: string;
  noindex?: boolean;
  /** Page number for paginated views; adds " – Page n" so titles stay unique. */
  page?: number;
}

export function collectionMetadata(input: CollectionMetadataInput): Metadata {
  const target = keywordTargetFor(input.path);
  const baseTitle = input.seoTitle || target?.title || input.name;
  const title = input.page && input.page > 1 ? `${baseTitle} – Page ${input.page}` : baseTitle;
  const description =
    input.seoDescription ||
    target?.description ||
    input.intro ||
    `Shop ${input.name.toLowerCase()} woven in Bhagalpur and sold direct by ${siteConfig.name}, with the fibre composition stated on every piece.`;
  return buildMetadata({
    title,
    description,
    path: input.path,
    canonical: input.canonical,
    image: input.image,
    noindex: input.noindex,
  });
}

export interface ArticleMetadataInput {
  path: string;
  title: string;
  seoTitle?: string | null;
  description: string;
  seoDescription?: string | null;
  image?: SeoImage | null;
  /** ISO 8601. */
  publishedAt: string;
  updatedAt?: string | null;
}

export function articleMetadata(input: ArticleMetadataInput): Metadata {
  const target = keywordTargetFor(input.path);
  return buildMetadata({
    title: input.seoTitle || target?.title || input.title,
    description: input.seoDescription || input.description || target?.description || input.title,
    path: input.path,
    image: input.image,
    type: "article",
    publishedTime: input.publishedAt,
    modifiedTime: input.updatedAt ?? undefined,
  });
}

/** Metadata for a static landing page whose title/description live in the keyword map. */
export function keywordPageMetadata(
  path: string,
  fallback: { title: string; description: string },
): Metadata {
  const target = keywordTargetFor(path);
  return buildMetadata({
    title: target?.title ?? fallback.title,
    description: target?.description ?? fallback.description,
    path,
  });
}
