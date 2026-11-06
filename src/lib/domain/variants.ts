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

/*
 * One SKU per product. Staff enter it once; each design gets a code under it, used wherever a
 * single design must be told apart (stock, cart, orders, ?variant= links, Google's variant data).
 *   one design      → the SKU itself          LINEN-SAREE-0004
 *   several designs → the SKU plus -D<n>      LINEN-SAREE-0004-D1, LINEN-SAREE-0004-D2
 */

/** Longest product SKU, leaving room for "-D99" within the 40-character design code. */
export const PRODUCT_SKU_MAX = 36;
const DESIGN_SUFFIX = /-D(\d{1,2})$/;

/** The product SKU a design code belongs to ("LINEN-SAREE-0004-D2" → "LINEN-SAREE-0004"). */
export function productSkuOf(code: string): string {
  return code.replace(DESIGN_SUFFIX, "");
}

/**
 * Design codes for a product's designs, in editor order. `current` holds each design's saved code
 * (null for a design added in this save). A design keeps its number across saves, even when the
 * SKU is renamed or another design is removed; new designs take the lowest free number.
 */
export function designCodes(productSku: string, current: readonly (string | null)[]): string[] {
  if (current.length === 1) return [productSku];
  const used = new Set<number>();
  const kept = current.map((code) => {
    const n = code ? Number(DESIGN_SUFFIX.exec(code)?.[1] ?? NaN) : NaN;
    if (!Number.isInteger(n) || n < 1 || used.has(n)) return null;
    used.add(n);
    return n;
  });
  let next = 1;
  return kept.map((n) => {
    if (n === null) {
      while (used.has(next)) next++;
      used.add(next);
      n = next;
    }
    return `${productSku}-D${n}`;
  });
}
