/**
 * Product, Offer and ProductGroup structured data (Google product snippets and merchant
 * listings). Shipping and return details are included because Merchant Center reads them.
 */
import { siteConfig } from "@/config/site";
import { absoluteUrl, legalUrl, productUrl } from "@/config/routes";
import type { SellUnit } from "@/lib/domain/enums";
import { organizationId } from "./constants";
import { absoluteUrls, compact, paiseToSchemaPrice } from "./jsonld-utils";
import {
  SCHEMA_CONTEXT,
  type AggregateRatingLd,
  type MerchantReturnPolicyLd,
  type OfferLd,
  type OfferShippingDetailsLd,
  type ProductGroupLd,
  type ProductLd,
  type ReviewLd,
  type WithContext,
} from "./schema-types";

/** Storefront availability; made-to-order maps to PreOrder (Merchant Center has no MadeToOrder). */
export type ProductAvailability = "in_stock" | "out_of_stock" | "made_to_order";

const AVAILABILITY_URL: Record<ProductAvailability, string> = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
  made_to_order: "https://schema.org/PreOrder",
};

export interface DayRange {
  min: number;
  max: number;
}

/**
 * Shipping terms for India. Load from the `settings` table (staff edit the flat rate and the
 * free-shipping threshold); never hard-code them, or rich results drift from the checkout.
 */
export interface ShippingPolicy {
  flatRatePaise: number;
  /** Orders at or above this value ship free; null when there is no free-shipping offer. */
  freeAbovePaise: number | null;
  /** Days from order to dispatch (brief: 24–48 h for ready stock). */
  handlingDays: DayRange;
  /** Courier transit days anywhere in India. */
  transitDays: DayRange;
}

export type RefundType = "exchange" | "store_credit" | "full_refund";

export type ReturnPolicy =
  | {
      returnable: true;
      days: number;
      freeReturn: boolean;
      refundTypes: readonly RefundType[];
    }
  | { returnable: false };

/** Brief, "Returns and exchanges": 7 days, exchange first, free reverse pickup, refund on request. */
export const DEFAULT_RETURN_POLICY: ReturnPolicy = {
  returnable: true,
  days: 7,
  freeReturn: true,
  refundTypes: ["exchange", "store_credit", "full_refund"],
};

/** Custom-cut fabric is excluded from returns (brief, "Exclusions"). */
export const NOT_RETURNABLE: ReturnPolicy = { returnable: false };

export interface RatingSummary {
  /** Mean of approved review ratings, 1–5. */
  average: number;
  count: number;
}

export interface ReviewInput {
  authorName: string;
  rating: number;
  /** ISO 8601 date, e.g. "2026-10-02". */
  datePublished: string;
  title?: string;
  body?: string;
}

export interface ProductJsonLdInput {
  name: string;
  slug: string;
  description: string;
  /** Paths or absolute URLs; the first is the primary image. */
  images: readonly string[];
  sku: string;
  /** GST-inclusive selling price in paise; per metre when sellUnit is "metre". */
  pricePaise: number;
  sellUnit: SellUnit;
  availability: ProductAvailability;
  /** Human-readable fibre composition, e.g. "Tussar silk" or "Tussar warp, ghicha weft". */
  material: string;
  color?: string;
  pattern?: string;
  category?: string;
  brand?: string;
  gtin?: string;
  mpn?: string;
  /** Override the page path (e.g. a colour variant URL). Defaults to productUrl(slug). */
  path?: string;
  /** ISO date; set only when the price genuinely ends (e.g. a scheduled sale). */
  priceValidUntil?: string;
  shipping: ShippingPolicy;
  /** Override handling time, e.g. weaving lead time for made-to-order pieces. */
  handlingDays?: DayRange;
  /** Defaults to NOT_RETURNABLE for metre-cut fabric, DEFAULT_RETURN_POLICY otherwise. */
  returns?: ReturnPolicy;
  rating?: RatingSummary | null;
  reviews?: readonly ReviewInput[];
  /** Proof points, e.g. { name: "Silk Mark label", value: "SM-12345" }. Only real records. */
  additionalProperties?: readonly { name: string; value: string }[];
}

export function shippingDetailsJsonLd(
  shipping: ShippingPolicy,
  pricePaise: number,
  handlingDays: DayRange = shipping.handlingDays,
): OfferShippingDetailsLd {
  // Rate is resolved against this offer's price: a single item at or above the threshold ships free.
  const free = shipping.freeAbovePaise !== null && pricePaise >= shipping.freeAbovePaise;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: paiseToSchemaPrice(free ? 0 : shipping.flatRatePaise),
      currency: siteConfig.currency,
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: handlingDays.min,
        maxValue: handlingDays.max,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: shipping.transitDays.min,
        maxValue: shipping.transitDays.max,
        unitCode: "DAY",
      },
    },
  };
}

const REFUND_TYPE_URL: Record<RefundType, string> = {
  exchange: "https://schema.org/ExchangeRefund",
  store_credit: "https://schema.org/StoreCreditRefund",
  full_refund: "https://schema.org/FullRefund",
};

export function returnPolicyJsonLd(policy: ReturnPolicy): MerchantReturnPolicyLd {
  const base = {
    "@type": "MerchantReturnPolicy" as const,
    applicableCountry: "IN",
    returnPolicyCountry: "IN",
    merchantReturnLink: absoluteUrl(legalUrl("returns-policy")),
  };
  if (!policy.returnable) {
    return { ...base, returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted" };
  }
  return {
    ...base,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: policy.days,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: policy.freeReturn
      ? "https://schema.org/FreeReturn"
      : "https://schema.org/ReturnFeesCustomerResponsibility",
    refundType: policy.refundTypes.map((t) => REFUND_TYPE_URL[t]),
  };
}

export function offerJsonLd(input: ProductJsonLdInput): OfferLd {
  const price = paiseToSchemaPrice(input.pricePaise);
  const returns =
    input.returns ?? (input.sellUnit === "metre" ? NOT_RETURNABLE : DEFAULT_RETURN_POLICY);
  return compact({
    "@type": "Offer" as const,
    url: absoluteUrl(input.path ?? productUrl(input.slug)),
    sku: input.sku,
    price,
    priceCurrency: siteConfig.currency,
    // Fabric is priced per metre: say so, or the price reads as the cost of the whole bolt.
    priceSpecification:
      input.sellUnit === "metre"
        ? {
            "@type": "UnitPriceSpecification" as const,
            price,
            priceCurrency: siteConfig.currency,
            referenceQuantity: { "@type": "QuantitativeValue" as const, value: 1, unitCode: "MTR" },
          }
        : undefined,
    priceValidUntil: input.priceValidUntil,
    availability: AVAILABILITY_URL[input.availability],
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization" as const, "@id": organizationId(), name: siteConfig.name },
    shippingDetails: shippingDetailsJsonLd(input.shipping, input.pricePaise, input.handlingDays),
    hasMerchantReturnPolicy: returnPolicyJsonLd(returns),
  });
}

/** AggregateRating, or undefined when there are no reviews (Google rejects reviewCount 0). */
export function aggregateRatingJsonLd(
  rating: RatingSummary | null | undefined,
): AggregateRatingLd | undefined {
  if (!rating || rating.count <= 0) return undefined;
  return {
    "@type": "AggregateRating",
    ratingValue: Math.round(rating.average * 10) / 10,
    reviewCount: rating.count,
    bestRating: 5,
    worstRating: 1,
  };
}

export function reviewJsonLd(review: ReviewInput): ReviewLd {
  return compact({
    "@type": "Review" as const,
    author: { "@type": "Person" as const, name: review.authorName },
    datePublished: review.datePublished,
    name: review.title,
    reviewBody: review.body,
    reviewRating: {
      "@type": "Rating" as const,
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
  });
}

function reviewsJsonLd(reviews: readonly ReviewInput[] | undefined): ReviewLd[] | undefined {
  return reviews?.length ? reviews.map(reviewJsonLd) : undefined;
}

function productNode(input: ProductJsonLdInput, asVariant = false): ProductLd {
  const url = absoluteUrl(input.path ?? productUrl(input.slug));
  return compact({
    "@type": "Product" as const,
    // Variants often share the page URL, so key them by SKU to keep node ids unique.
    "@id": asVariant ? `${url}#variant-${encodeURIComponent(input.sku)}` : `${url}#product`,
    name: input.name,
    description: input.description,
    url,
    image: absoluteUrls(input.images),
    sku: input.sku,
    brand: { "@type": "Brand" as const, name: input.brand ?? siteConfig.name },
    material: input.material,
    color: input.color,
    pattern: input.pattern,
    category: input.category,
    gtin: input.gtin,
    mpn: input.mpn,
    additionalProperty: input.additionalProperties?.length
      ? input.additionalProperties.map((p) => ({
          "@type": "PropertyValue" as const,
          name: p.name,
          value: p.value,
        }))
      : undefined,
    offers: offerJsonLd(input),
    aggregateRating: aggregateRatingJsonLd(input.rating),
    review: reviewsJsonLd(input.reviews),
  });
}

/** A single-variant product page. */
export function productJsonLd(input: ProductJsonLdInput): WithContext<ProductLd> {
  return { "@context": SCHEMA_CONTEXT, ...productNode(input) };
}

export type VariesBy = "color" | "size" | "pattern" | "material";

export interface ProductGroupJsonLdInput {
  name: string;
  /** Slug of the product page that lists the variants. */
  slug: string;
  description: string;
  /** Stable parent id, e.g. the product's style code; shared with the Merchant Center feed. */
  productGroupId: string;
  variesBy?: readonly VariesBy[];
  images?: readonly string[];
  material?: string;
  brand?: string;
  /** Each colour variant; give each a distinct `path` (e.g. ?colour=rust) when it has its own URL. */
  variants: readonly ProductJsonLdInput[];
  rating?: RatingSummary | null;
  reviews?: readonly ReviewInput[];
}

/** A product page with colour (or other) variants. */
export function productGroupJsonLd(input: ProductGroupJsonLdInput): WithContext<ProductGroupLd> {
  const url = absoluteUrl(productUrl(input.slug));
  return compact({
    "@context": SCHEMA_CONTEXT,
    "@type": "ProductGroup" as const,
    "@id": `${url}#productgroup`,
    name: input.name,
    description: input.description,
    url,
    image: input.images?.length ? absoluteUrls(input.images) : undefined,
    brand: { "@type": "Brand" as const, name: input.brand ?? siteConfig.name },
    material: input.material,
    productGroupID: input.productGroupId,
    variesBy: (input.variesBy ?? ["color"]).map((v) => `https://schema.org/${v}`),
    // Ratings and reviews belong to the group, not repeated on every variant.
    hasVariant: input.variants.map((v) =>
      productNode({ ...v, rating: null, reviews: undefined }, true),
    ),
    aggregateRating: aggregateRatingJsonLd(input.rating),
    review: reviewsJsonLd(input.reviews),
  });
}
