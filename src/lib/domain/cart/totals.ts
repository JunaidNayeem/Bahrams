import type { CouponType, PaymentMethod } from "../enums";
import {
  allocateProportionally,
  assertPaise,
  percentOf,
  roundHalfUp,
  sumPaise,
  type Paise,
} from "../money";
import { lineTotal } from "../pricing/line-total";
import { amountToFreeShipping, qualifiesForFreeShipping } from "../shipping";
import {
  GST_RATE_RULES,
  resolveGstRate,
  splitGstInclusive,
  sumGst,
  supplyTypeFor,
  type GstRateRule,
  type GstSplit,
  type GstTotals,
  type SupplyType,
} from "../tax/gst";
import { SELLER_GST_STATE_CODE } from "../tax/states";
import { toDate, type DateInput } from "../time";

/**
 * Cart and checkout totals, all in paise. Prices are GST-inclusive, so GST is reported as
 * "included", never added on top. Every charge appears as its own line in `breakdown` before
 * the shopper pays (no drip pricing), and no amount can go negative.
 *
 * Order of discounts: automatic offers → one coupon → prepaid incentive. Shipping, COD fee and
 * gift wrap are then added. For GST, discounts and charges are spread over lines in proportion
 * to value so each line's taxable value reflects what was actually paid.
 * TODO(client): confirm with the CA that charges follow the goods' rate (composite supply).
 */

export interface CartLineInput {
  id: string;
  /** GST-inclusive unit price after any bulk tier (per piece or per metre). */
  unitPricePaise: Paise;
  quantity: number;
  hsn: string;
}

export interface PricedLine extends CartLineInput {
  lineTotalPaise: Paise;
}

export interface CouponInput {
  code: string;
  type: CouponType;
  /** percentage: percent off (e.g. 10); flat: paise off; free_shipping: ignored. */
  value: number;
  maxDiscountPaise?: Paise | null;
  /** Compared with the merchandise subtotal before any discount. */
  minOrderPaise?: Paise | null;
  startsAt?: DateInput | null;
  endsAt?: DateInput | null;
}

export type CouponRejection =
  "empty_cart" | "not_started" | "expired" | "below_minimum_order" | "invalid_value";

export interface CouponOutcome {
  code: string;
  type: CouponType;
  applied: boolean;
  discountPaise: Paise;
  freeShipping: boolean;
  reason: CouponRejection | null;
  /** How much more to add to meet the minimum order, when that is the reason. */
  shortfallPaise: Paise | null;
}

export interface OfferContext {
  lines: readonly PricedLine[];
  subtotalPaise: Paise;
}

/** Hook for automatic offers (bundles, festive sale rules); returns the discount it grants. */
export interface AutomaticOffer {
  id: string;
  /** Shopper-facing, e.g. "Buy 2 sarees, save ₹500". */
  label: string;
  discountFor(context: OfferContext): Paise;
}

/** A visible reward for paying online instead of COD. */
export type PrepaidIncentive =
  | { type: "none" }
  | { type: "flat"; amountPaise: Paise }
  | { type: "percentage"; percent: number; maxDiscountPaise?: Paise | null }
  | { type: "free_shipping" };

export interface CartPricingSettings {
  shippingFeePaise: Paise;
  /** Merchandise value (after offers and coupon) at which shipping is free; null = never. */
  freeShippingThresholdPaise: Paise | null;
  codFeePaise: Paise;
  giftWrapFeePaise: Paise;
  prepaidIncentive: PrepaidIncentive;
  sellerStateCode?: string;
  gstRules?: Readonly<Record<string, GstRateRule>>;
}

export interface CartTotalsInput {
  lines: readonly CartLineInput[];
  coupon?: CouponInput | null;
  automaticOffers?: readonly AutomaticOffer[];
  /** null until the shopper picks one; no COD fee or prepaid incentive is applied then. */
  paymentMethod: PaymentMethod | null;
  giftWrap?: boolean;
  /** GST state code of the delivery address; null before an address is known. */
  destinationStateCode?: string | null;
  settings: CartPricingSettings;
  now: DateInput;
}

export interface CartLineTotals {
  id: string;
  hsn: string;
  unitPricePaise: Paise;
  quantity: number;
  lineTotalPaise: Paise;
  /** Share of offers, coupon and prepaid discount. */
  discountPaise: Paise;
  /** Share of shipping, COD fee and gift wrap. */
  chargesPaise: Paise;
  payablePaise: Paise;
  gst: GstSplit;
}

export type ShippingWaiver = "coupon" | "threshold" | "prepaid";

export type TotalsItemKind =
  | "subtotal"
  | "offer"
  | "coupon"
  | "prepaid_discount"
  | "shipping"
  | "cod_fee"
  | "gift_wrap"
  | "grand_total"
  | "gst_included";

export interface TotalsItem {
  kind: TotalsItemKind;
  label: string;
  /** Signed: discounts are negative. `gst_included` is informational and not part of the sum. */
  amountPaise: number;
}

export interface CartTotals {
  lines: CartLineTotals[];
  subtotalPaise: Paise;
  offers: { id: string; label: string; discountPaise: Paise }[];
  coupon: CouponOutcome | null;
  prepaidDiscountPaise: Paise;
  discountTotalPaise: Paise;
  shipping: {
    feePaise: Paise;
    chargedPaise: Paise;
    waivedBy: ShippingWaiver | null;
    /** Still to add for free shipping; 0 once free, null when no threshold applies. */
    amountToFreeShippingPaise: Paise | null;
  };
  codFeePaise: Paise;
  giftWrapPaise: Paise;
  /** `supply` is null until the delivery state is known; tax is then estimated as IGST. */
  gst: GstTotals & { supply: SupplyType | null };
  grandTotalPaise: Paise;
  breakdown: TotalsItem[];
}

const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max));

export function evaluateCoupon(
  coupon: CouponInput,
  context: { subtotalPaise: Paise; discountBasePaise: Paise; now: DateInput },
): CouponOutcome {
  const reject = (reason: CouponRejection, shortfallPaise: Paise | null = null): CouponOutcome => ({
    code: coupon.code,
    type: coupon.type,
    applied: false,
    discountPaise: 0,
    freeShipping: false,
    reason,
    shortfallPaise,
  });
  const now = toDate(context.now).getTime();
  if (context.subtotalPaise <= 0) return reject("empty_cart");
  if (coupon.startsAt != null && now < toDate(coupon.startsAt).getTime())
    return reject("not_started");
  if (coupon.endsAt != null && now > toDate(coupon.endsAt).getTime()) return reject("expired");
  if (coupon.minOrderPaise != null && context.subtotalPaise < coupon.minOrderPaise) {
    return reject("below_minimum_order", coupon.minOrderPaise - context.subtotalPaise);
  }

  let discountPaise = 0;
  if (coupon.type === "percentage") {
    if (!(coupon.value > 0 && coupon.value <= 100)) return reject("invalid_value");
    discountPaise = percentOf(context.discountBasePaise, coupon.value);
  } else if (coupon.type === "flat") {
    if (!Number.isSafeInteger(coupon.value) || coupon.value <= 0) return reject("invalid_value");
    discountPaise = coupon.value;
  }
  if (coupon.maxDiscountPaise != null)
    discountPaise = Math.min(discountPaise, coupon.maxDiscountPaise);
  return {
    code: coupon.code,
    type: coupon.type,
    applied: true,
    discountPaise: clamp(discountPaise, context.discountBasePaise),
    freeShipping: coupon.type === "free_shipping",
    reason: null,
    shortfallPaise: null,
  };
}

function prepaidDiscount(incentive: PrepaidIncentive, basePaise: Paise): Paise {
  switch (incentive.type) {
    case "flat":
      return clamp(incentive.amountPaise, basePaise);
    case "percentage": {
      const raw = percentOf(basePaise, incentive.percent);
      const capped =
        incentive.maxDiscountPaise == null ? raw : Math.min(raw, incentive.maxDiscountPaise);
      return clamp(capped, basePaise);
    }
    default:
      return 0;
  }
}

export function computeCartTotals(input: CartTotalsInput): CartTotals {
  const { settings, paymentMethod } = input;
  const rules = settings.gstRules ?? GST_RATE_RULES;
  const isPrepaid = paymentMethod !== null && paymentMethod !== "cod";

  const lines: PricedLine[] = input.lines.map((line) => ({
    ...line,
    lineTotalPaise: lineTotal(line.unitPricePaise, line.quantity),
  }));
  const subtotalPaise = sumPaise(lines.map((l) => l.lineTotalPaise));
  const hasItems = lines.length > 0 && subtotalPaise > 0;

  let remaining = subtotalPaise;
  const offers: CartTotals["offers"] = [];
  for (const offer of input.automaticOffers ?? []) {
    const discountPaise = clamp(
      assertPaise(offer.discountFor({ lines, subtotalPaise }), offer.id),
      remaining,
    );
    if (discountPaise > 0) {
      offers.push({ id: offer.id, label: offer.label, discountPaise });
      remaining -= discountPaise;
    }
  }

  const coupon = input.coupon
    ? evaluateCoupon(input.coupon, { subtotalPaise, discountBasePaise: remaining, now: input.now })
    : null;
  remaining -= coupon?.discountPaise ?? 0;
  const merchandiseAfterPromotions = remaining;

  const prepaidDiscountPaise = isPrepaid
    ? prepaidDiscount(settings.prepaidIncentive, remaining)
    : 0;
  remaining -= prepaidDiscountPaise;
  const discountTotalPaise = subtotalPaise - remaining;

  // The prepaid saving is excluded from the threshold test so choosing to pay online can
  // never cost the shopper free shipping.
  let waivedBy: ShippingWaiver | null = null;
  if (coupon?.freeShipping) waivedBy = "coupon";
  else if (
    qualifiesForFreeShipping(merchandiseAfterPromotions, settings.freeShippingThresholdPaise)
  ) {
    waivedBy = "threshold";
  } else if (isPrepaid && settings.prepaidIncentive.type === "free_shipping") waivedBy = "prepaid";
  const shippingFeePaise = hasItems ? settings.shippingFeePaise : 0;
  const shippingChargedPaise = waivedBy ? 0 : shippingFeePaise;
  const codFeePaise = hasItems && paymentMethod === "cod" ? settings.codFeePaise : 0;
  const giftWrapPaise = hasItems && input.giftWrap ? settings.giftWrapFeePaise : 0;

  const supply = input.destinationStateCode
    ? supplyTypeFor(input.destinationStateCode, settings.sellerStateCode ?? SELLER_GST_STATE_CODE)
    : null;
  const lineDiscounts = allocateProportionally(
    discountTotalPaise,
    lines.map((l) => l.lineTotalPaise),
  );
  const netValues = lines.map((l, i) => l.lineTotalPaise - lineDiscounts[i]);
  const chargesTotal = shippingChargedPaise + codFeePaise + giftWrapPaise;
  const lineCharges = allocateProportionally(chargesTotal, netValues);

  const lineTotals: CartLineTotals[] = lines.map((line, i) => {
    const payablePaise = netValues[i] + lineCharges[i];
    // The apparel rate band depends on the per-piece value actually paid, after discounts.
    const ratePercent = resolveGstRate(line.hsn, roundHalfUp(netValues[i] / line.quantity), rules);
    return {
      id: line.id,
      hsn: line.hsn,
      unitPricePaise: line.unitPricePaise,
      quantity: line.quantity,
      lineTotalPaise: line.lineTotalPaise,
      discountPaise: lineDiscounts[i],
      chargesPaise: lineCharges[i],
      payablePaise,
      gst: splitGstInclusive(payablePaise, ratePercent, supply ?? "inter_state"),
    };
  });

  const grandTotalPaise = remaining + chargesTotal;
  const gst = { ...sumGst(lineTotals.map((l) => l.gst)), supply };

  const breakdown: TotalsItem[] = [
    { kind: "subtotal", label: "Subtotal", amountPaise: subtotalPaise },
  ];
  for (const offer of offers) {
    breakdown.push({ kind: "offer", label: offer.label, amountPaise: -offer.discountPaise });
  }
  if (coupon?.applied && coupon.discountPaise > 0) {
    breakdown.push({
      kind: "coupon",
      label: `Coupon ${coupon.code}`,
      amountPaise: -coupon.discountPaise,
    });
  }
  if (prepaidDiscountPaise > 0) {
    breakdown.push({
      kind: "prepaid_discount",
      label: "Online payment saving",
      amountPaise: -prepaidDiscountPaise,
    });
  }
  if (hasItems)
    breakdown.push({ kind: "shipping", label: "Shipping", amountPaise: shippingChargedPaise });
  if (codFeePaise > 0) {
    breakdown.push({ kind: "cod_fee", label: "Cash on delivery fee", amountPaise: codFeePaise });
  }
  if (giftWrapPaise > 0)
    breakdown.push({ kind: "gift_wrap", label: "Gift wrap", amountPaise: giftWrapPaise });
  breakdown.push({ kind: "grand_total", label: "Total", amountPaise: grandTotalPaise });
  breakdown.push({ kind: "gst_included", label: "Includes GST", amountPaise: gst.taxPaise });

  return {
    lines: lineTotals,
    subtotalPaise,
    offers,
    coupon,
    prepaidDiscountPaise,
    discountTotalPaise,
    shipping: {
      feePaise: shippingFeePaise,
      chargedPaise: shippingChargedPaise,
      waivedBy,
      amountToFreeShippingPaise: waivedBy
        ? 0
        : amountToFreeShipping(merchandiseAfterPromotions, settings.freeShippingThresholdPaise),
    },
    codFeePaise,
    giftWrapPaise,
    gst,
    grandTotalPaise,
    breakdown,
  };
}

/** Both totals side by side, so checkout can show "Pay online and save ₹X" before the choice. */
export function compareCodAndPrepaid(input: Omit<CartTotalsInput, "paymentMethod">): {
  prepaid: CartTotals;
  cod: CartTotals;
  prepaidSavingPaise: Paise;
} {
  const prepaid = computeCartTotals({ ...input, paymentMethod: "upi" });
  const cod = computeCartTotals({ ...input, paymentMethod: "cod" });
  return {
    prepaid,
    cod,
    prepaidSavingPaise: Math.max(0, cod.grandTotalPaise - prepaid.grandTotalPaise),
  };
}
