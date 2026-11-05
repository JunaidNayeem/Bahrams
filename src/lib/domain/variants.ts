/**
 * Variants of one product can differ by design (pattern), colour, or both. Each design can have
 * its own photos; photos with no variant are shared by every design (e.g. a fabric close-up).
 */

export interface VariantNaming {
  sku: string;
  title: string | null;
  colour: string | null;
}

export interface VariantImage {
  variantId?: string | null;
}

/** "Peacock border · Mustard", "Peacock border", "Mustard", or the SKU as a last resort. */
export function variantLabel(v: VariantNaming): string {
  return [v.title, v.colour].filter(Boolean).join(" · ") || v.sku;
}

/** What the shopper is choosing between: designs when variants have distinct names, else colours. */
export function variantChoiceKind(variants: readonly VariantNaming[]): "design" | "colour" {
  const titles = new Set(variants.map((v) => v.title).filter(Boolean));
  return titles.size > 1 ? "design" : "colour";
}

/** schema.org variesBy values for a ProductGroup. */
export function variesByOf(variants: readonly VariantNaming[]): ("pattern" | "color")[] {
  const distinct = (pick: (v: VariantNaming) => string | null) =>
    new Set(variants.map(pick).filter(Boolean)).size > 1;
  const out: ("pattern" | "color")[] = [];
  if (distinct((v) => v.title)) out.push("pattern");
  if (distinct((v) => v.colour)) out.push("color");
  return out.length ? out : ["color"];
}

/**
 * Photos to show for a variant: its own photos first, then the shared ones. Photos of other
 * designs are never mixed in, so a shopper cannot mistake one design's photo for another's.
 * Only when a product has no photo usable for this variant at all do we fall back to every photo
 * (better than an empty gallery; the admin flags designs without photos).
 */
export function imagesForVariant<T extends VariantImage>(
  images: readonly T[],
  variantId: string | null | undefined,
): T[] {
  const own = variantId ? images.filter((i) => i.variantId === variantId) : [];
  const shared = images.filter((i) => !i.variantId);
  const result = [...own, ...shared];
  return result.length ? result : [...images];
}

/** First photo of each variant that has one of its own, for picker thumbnails and the cart. */
export function firstImageByVariant<T extends VariantImage>(images: readonly T[]): Map<string, T> {
  const out = new Map<string, T>();
  for (const img of images)
    if (img.variantId && !out.has(img.variantId)) out.set(img.variantId, img);
  return out;
}

/** Query parameter that preselects a variant (?variant=<sku>), so each design has a shareable URL. */
export const VARIANT_PARAM = "variant";

export function variantPath(productPath: string, sku: string): string {
  return `${productPath}?${VARIANT_PARAM}=${encodeURIComponent(sku.toLowerCase())}`;
}

export function findVariantBySku<T extends { sku: string }>(
  variants: readonly T[],
  sku: string | null | undefined,
): T | undefined {
  if (!sku) return undefined;
  const wanted = sku.trim().toLowerCase();
  return variants.find((v) => v.sku.toLowerCase() === wanted);
}
