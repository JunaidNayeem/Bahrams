import { siteOrigin } from "@/config/routes";

/** Google shows roughly 60 characters of a title and 155–160 of a description on mobile. */
export const TITLE_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 155;

export const TITLE_SEPARATOR = " | ";

/**
 * Default share image (1200x630) and logo for structured data.
 * TODO(client): final brand assets; the brand agent should place them at these paths in /public.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/og/default.jpg",
  width: 1200,
  height: 630,
  alt: "Bahram Silks: tussar silk on a handloom in Bhagalpur",
} as const;

export const LOGO_PATH = "/brand/logo-512.png";

/** Stable JSON-LD node ids so Product/Article/Store nodes can reference the same entities. */
export function organizationId(): string {
  return `${siteOrigin()}/#organization`;
}

export function websiteId(): string {
  return `${siteOrigin()}/#website`;
}

export const OG_LOCALE = "en_IN";
