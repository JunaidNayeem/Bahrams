import { assertPaise, type Paise } from "../money";

/**
 * Bulk price tiers for fabric by the metre: buying at least `minQuantity` metres drops the
 * per-metre price to `unitPricePaise`. Boutiques and tailors are the audience.
 */
export interface BulkTier {
  minQuantity: number;
  unitPricePaise: Paise;
}

export interface BulkTierResolution {
  unitPricePaise: Paise;
  /** The tier in effect, or null when the base price applies. */
  tier: BulkTier | null;
  /** The next cheaper tier, so the UI can say "buy 2 m more to pay ₹X/m". */
  next: { tier: BulkTier; quantityNeeded: number; savingPerUnitPaise: Paise } | null;
}

export type BulkTierIssue =
  | "invalid_min_quantity"
  | "invalid_price"
  | "duplicate_min_quantity"
  | "price_not_below_base"
  | "price_not_decreasing";

const sortTiers = (tiers: readonly BulkTier[]) =>
  [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);

/** Admin-side check: tiers must start above 1 unit, never exceed the base price and get cheaper. */
export function validateBulkTiers(
  basePricePaise: Paise,
  tiers: readonly BulkTier[],
): { valid: boolean; reason: BulkTierIssue | null } {
  const sorted = sortTiers(tiers);
  let previousPrice = basePricePaise;
  for (let i = 0; i < sorted.length; i++) {
    const tier = sorted[i];
    if (!Number.isFinite(tier.minQuantity) || tier.minQuantity <= 1) {
      return { valid: false, reason: "invalid_min_quantity" };
    }
    if (!Number.isSafeInteger(tier.unitPricePaise) || tier.unitPricePaise <= 0) {
      return { valid: false, reason: "invalid_price" };
    }
    if (i > 0 && sorted[i - 1].minQuantity === tier.minQuantity) {
      return { valid: false, reason: "duplicate_min_quantity" };
    }
    if (tier.unitPricePaise >= basePricePaise) {
      return { valid: false, reason: "price_not_below_base" };
    }
    if (tier.unitPricePaise >= previousPrice) {
      return { valid: false, reason: "price_not_decreasing" };
    }
    previousPrice = tier.unitPricePaise;
  }
  return { valid: true, reason: null };
}

/**
 * Picks the cheapest tier the quantity qualifies for. A tier priced at or above the base price
 * is ignored, so a misconfigured tier can never make a larger order more expensive per unit.
 */
export function resolveBulkTier(
  basePricePaise: Paise,
  tiers: readonly BulkTier[],
  quantity: number,
): BulkTierResolution {
  assertPaise(basePricePaise, "basePricePaise");
  const usable = sortTiers(tiers).filter((t) => t.unitPricePaise < basePricePaise);
  let tier: BulkTier | null = null;
  for (const candidate of usable) {
    if (
      quantity >= candidate.minQuantity &&
      (!tier || candidate.unitPricePaise < tier.unitPricePaise)
    ) {
      tier = candidate;
    }
  }
  const unitPricePaise = tier?.unitPricePaise ?? basePricePaise;
  const nextTier = usable.find(
    (t) => t.minQuantity > quantity && t.unitPricePaise < unitPricePaise,
  );
  return {
    unitPricePaise,
    tier,
    next: nextTier
      ? {
          tier: nextTier,
          quantityNeeded: nextTier.minQuantity - quantity,
          savingPerUnitPaise: unitPricePaise - nextTier.unitPricePaise,
        }
      : null,
  };
}
