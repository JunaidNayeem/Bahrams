import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { computeClaims, type FibreShare, type ProductClaims } from "@/lib/domain/claims";
import type { Fibre, Occasion, ProductKind, SellUnit } from "@/lib/domain/enums";
import { resolveDisplayedDiscount, type DisplayedDiscount } from "@/lib/domain/pricing";
import { createPublicClient } from "@/lib/supabase/public";

import { CATALOG_TAG, type ProductImage } from "./catalog";
import { productMediaUrl } from "./media";

export interface PriceTier {
  minQty: number;
  pricePaise: number;
}

export interface Variant {
  id: string;
  sku: string;
  title: string | null;
  colour: string | null;
  colourHex: string | null;
  sellUnit: SellUnit;
  pricePaise: number;
  /** Compare-at price and saving, present only when backed by genuine price history. */
  discount: DisplayedDiscount;
  minQty: number;
  stepQty: number;
  maxQty: number | null;
  tiers: PriceTier[];
}

export interface Review {
  id: string;
  authorName: string;
  authorCity: string | null;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  replyBody: string | null;
  createdAt: string;
}

export interface ProductDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  kind: ProductKind;
  primaryFibre: Fibre;
  fibreWarp: Fibre | null;
  fibreWeft: Fibre | null;
  composition: string;
  weave: string | null;
  zari: string | null;
  blouseIncluded: boolean;
  lengthM: number | null;
  blouseLengthM: number | null;
  widthCm: number | null;
  weightG: number | null;
  care: string | null;
  descriptionHtml: string | null;
  occasions: Occasion[];
  isOneOfAKind: boolean;
  madeToOrder: boolean;
  leadTimeDays: number | null;
  giEligible: boolean;
  returnable: boolean;
  swatchAvailable: boolean;
  swatchPricePaise: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  noindex: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  claims: ProductClaims;
  weaver: { slug: string; name: string; locality: string | null; isSample: boolean } | null;
  images: ProductImage[];
  variants: Variant[];
  reviews: Review[];
}

/**
 * Fibre shares for the claims engine. The catalogue records warp and weft fibres (not
 * percentages), so a product counts as all-silk only when every recorded fibre is a silk.
 */
function compositionShares(primary: Fibre, warp: Fibre | null, weft: Fibre | null): FibreShare[] {
  if (warp && weft) return [{ fibre: warp, percent: 50 }, { fibre: weft, percent: 50 }];
  return [{ fibre: warp ?? weft ?? primary, percent: 100 }];
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG, `product:${slug}`);

  const supabase = createPublicClient();
  const { data: p, error } = await supabase
    .from("products")
    .select(
      `*,
       weavers ( slug, name, locality, is_sample ),
       product_media ( storage_path, alt, sort, kind, width, height ),
       product_variants ( *, variant_price_tiers ( min_qty, price_paise ), price_history ( price_paise, effective_from, effective_to ) ),
       authenticity_labels ( label_type, label_number, status, variant_id ),
       reviews ( id, author_name, author_city, rating, title, body, verified_purchase, reply_body, created_at, status )`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!p) return null;

  const now = new Date();
  const liveLabels = p.authenticity_labels.filter((l) => l.status === "attached" || l.status === "sold");
  const labelOf = (type: string) => liveLabels.find((l) => l.label_type === type)?.label_number ?? null;

  const variants: Variant[] = p.product_variants
    .filter((v) => v.active)
    .sort((a, b) => a.position - b.position)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      title: v.title,
      colour: v.colour,
      colourHex: v.colour_hex,
      sellUnit: v.sell_unit,
      pricePaise: v.price_paise,
      discount: resolveDisplayedDiscount({
        currentPricePaise: v.price_paise,
        compareAtPaise: v.compare_at_paise,
        history: v.price_history.map((h) => ({
          pricePaise: h.price_paise,
          effectiveFrom: h.effective_from,
          effectiveTo: h.effective_to,
        })),
        now,
      }),
      minQty: Number(v.min_qty),
      stepQty: Number(v.step_qty),
      maxQty: v.max_qty === null ? null : Number(v.max_qty),
      tiers: v.variant_price_tiers
        .map((t) => ({ minQty: Number(t.min_qty), pricePaise: t.price_paise }))
        .sort((a, b) => a.minQty - b.minQty),
    }));

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    kind: p.kind,
    primaryFibre: p.primary_fibre,
    fibreWarp: p.fibre_warp,
    fibreWeft: p.fibre_weft,
    composition: p.composition,
    weave: p.weave,
    zari: p.zari,
    blouseIncluded: p.blouse_included,
    lengthM: p.length_m === null ? null : Number(p.length_m),
    blouseLengthM: p.blouse_length_m === null ? null : Number(p.blouse_length_m),
    widthCm: p.width_cm === null ? null : Number(p.width_cm),
    weightG: p.weight_g,
    care: p.care,
    descriptionHtml: p.description,
    occasions: p.occasions,
    isOneOfAKind: p.is_one_of_a_kind,
    madeToOrder: p.made_to_order,
    leadTimeDays: p.lead_time_days,
    giEligible: p.gi_eligible,
    returnable: p.returnable,
    swatchAvailable: p.swatch_available,
    swatchPricePaise: p.swatch_price_paise,
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
    noindex: p.noindex,
    ratingAvg: p.rating_avg === null ? null : Number(p.rating_avg),
    ratingCount: p.rating_count,
    claims: computeClaims({
      composition: compositionShares(p.primary_fibre, p.fibre_warp, p.fibre_weft),
      silkMarkLabelNumber: labelOf("silk_mark"),
      handloomMarkLabelNumber: labelOf("handloom_mark"),
      giEligible: p.gi_eligible,
    }),
    weaver: p.weavers
      ? { slug: p.weavers.slug, name: p.weavers.name, locality: p.weavers.locality, isSample: p.weavers.is_sample }
      : null,
    images: p.product_media
      .filter((m) => m.kind === "image")
      .sort((a, b) => a.sort - b.sort)
      .map((m) => ({ url: productMediaUrl(m.storage_path), alt: m.alt, width: m.width, height: m.height })),
    variants,
    reviews: p.reviews
      .filter((r) => r.status === "approved")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((r) => ({
        id: r.id,
        authorName: r.author_name,
        authorCity: r.author_city,
        rating: r.rating,
        title: r.title,
        body: r.body,
        verifiedPurchase: r.verified_purchase,
        replyBody: r.reply_body,
        createdAt: r.created_at,
      })),
  };
}

/** Live stock per variant (on hand minus active reservations). Not cached: read in <Suspense>. */
export async function getAvailability(variantIds: string[]): Promise<Record<string, number>> {
  if (variantIds.length === 0) return {};
  const { data, error } = await createPublicClient().rpc("variant_availability", {
    p_variant_ids: variantIds,
  });
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.variant_id, Number(r.available)]));
}

export interface Pincode {
  pincode: string;
  city: string | null;
  state: string | null;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estDaysMin: number;
  estDaysMax: number;
}

export async function getPincode(pincode: string): Promise<Pincode | null> {
  "use cache";
  cacheLife("days");
  cacheTag("pincodes");

  const { data, error } = await createPublicClient()
    .from("serviceable_pincodes")
    .select("pincode, city, state, cod_available, prepaid_available, est_days_min, est_days_max, active")
    .eq("pincode", pincode)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.active) return null;
  return {
    pincode: data.pincode,
    city: data.city,
    state: data.state,
    codAvailable: data.cod_available,
    prepaidAvailable: data.prepaid_available,
    estDaysMin: data.est_days_min,
    estDaysMax: data.est_days_max,
  };
}
