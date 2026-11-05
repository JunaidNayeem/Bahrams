import type { OrderStatus, ReturnResolution, SellUnit } from "./enums";
import { addDays, endOfIstDay, toDate, type DateInput } from "./time";

/** Kickoff: Operations → Returns and exchanges. */
export const RETURN_WINDOW_DAYS = 7;

/** Exchange or store credit is offered first; refund to source on request. */
export const RETURN_RESOLUTION_PREFERENCE: readonly ReturnResolution[] = [
  "exchange",
  "store_credit",
  "refund_to_source",
];

export const RETURN_CONDITIONS: readonly string[] = [
  "Unused and unwashed, with no perfume, stains or alterations",
  "All tags and labels intact",
  "Returned in the original packaging",
];

export interface ReturnItemFacts {
  sellUnit: SellUnit;
  /** Cut to the shopper's length. Fabric sold by the metre is always treated as custom-cut. */
  customCut?: boolean;
  stitchedToMeasure?: boolean;
  /** Sold as "final sale", stated clearly before purchase. */
  finalSale?: boolean;
}

export type ReturnIneligibilityReason =
  "not_delivered" | "window_closed" | "custom_cut_fabric" | "stitched_to_measure" | "final_sale";

export interface ReturnEligibility {
  eligible: boolean;
  reasons: ReturnIneligibilityReason[];
  /** End of the last day a return can be requested (IST), or null if not yet delivered. */
  windowEndsAt: Date | null;
}

/** Excluded at purchase time, regardless of delivery; show this on the product page. */
export function returnExclusions(item: ReturnItemFacts): ReturnIneligibilityReason[] {
  const reasons: ReturnIneligibilityReason[] = [];
  if (item.customCut || item.sellUnit === "metre") reasons.push("custom_cut_fabric");
  if (item.stitchedToMeasure) reasons.push("stitched_to_measure");
  if (item.finalSale) reasons.push("final_sale");
  return reasons;
}

/** Seven days from delivery, through to the end of the seventh day in IST. */
export function returnWindowEndsAt(deliveredAt: DateInput, windowDays = RETURN_WINDOW_DAYS): Date {
  return endOfIstDay(addDays(deliveredAt, windowDays));
}

export interface ReturnEligibilityInput {
  item: ReturnItemFacts;
  orderStatus: OrderStatus;
  deliveredAt: DateInput | null;
  now: DateInput;
}

export function returnEligibility(input: ReturnEligibilityInput): ReturnEligibility {
  const reasons: ReturnIneligibilityReason[] = [];
  let windowEndsAt: Date | null = null;
  if (input.orderStatus !== "delivered" || input.deliveredAt === null) {
    reasons.push("not_delivered");
  } else {
    windowEndsAt = returnWindowEndsAt(input.deliveredAt);
    if (toDate(input.now).getTime() > windowEndsAt.getTime()) reasons.push("window_closed");
  }
  reasons.push(...returnExclusions(input.item));
  return { eligible: reasons.length === 0, reasons, windowEndsAt };
}

export function returnReasonMessage(reason: ReturnIneligibilityReason): string {
  switch (reason) {
    case "not_delivered":
      return "Returns can be requested once your order has been delivered.";
    case "window_closed":
      return `The ${RETURN_WINDOW_DAYS}-day return window for this order has closed.`;
    case "custom_cut_fabric":
      return "Fabric cut to your length cannot be returned.";
    case "stitched_to_measure":
      return "Items stitched to your measurements cannot be returned.";
    case "final_sale":
      return "This item was sold as final sale and cannot be returned.";
  }
}
