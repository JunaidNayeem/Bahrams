import { isPaise, type Paise } from "../money";
import { DAY_MS, toDate, type DateInput } from "../time";

/**
 * Consumer Protection (E-Commerce) Amendment Rules 2026 (in force 1 Jan 2027): a discount may
 * be shown only against a genuine "prior price". We accept a compare-at price only when the
 * product was actually sold at exactly that price for an unbroken run of at least
 * PRIOR_PRICE_MIN_DAYS inside the PRIOR_PRICE_LOOKBACK_DAYS before now, and it is higher than
 * today's price. An unbroken run (rather than days added up across separate spells) is the
 * conservative reading; confirm with counsel before launch.
 */
export const PRIOR_PRICE_MIN_DAYS = 7;
export const PRIOR_PRICE_LOOKBACK_DAYS = 90;

/** One row of `price_history`: the price charged from `effectiveFrom` until `effectiveTo`. */
export interface PriceHistoryEntry {
  pricePaise: Paise;
  effectiveFrom: DateInput;
  /** null while the price is still current. */
  effectiveTo: DateInput | null;
}

export type PriorPriceReason =
  | "no_compare_at"
  | "invalid_amount"
  | "not_higher_than_current"
  | "not_charged_in_lookback"
  | "charged_too_briefly";

export interface PriorPriceValidation {
  valid: boolean;
  reason: PriorPriceReason | null;
  /** Longest unbroken run (whole days) at the compare-at price inside the lookback window. */
  qualifyingDays: number;
}

export interface PriorPriceInput {
  currentPricePaise: Paise;
  compareAtPaise: Paise | null | undefined;
  history: readonly PriceHistoryEntry[];
  now: DateInput;
  minDays?: number;
  lookbackDays?: number;
}

interface Interval {
  start: number;
  end: number;
}

function safeTime(input: DateInput): number | null {
  try {
    return toDate(input).getTime();
  } catch {
    return null;
  }
}

function longestRunMs(intervals: Interval[]): number {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  let longest = 0;
  let current: Interval | null = null;
  for (const interval of sorted) {
    if (current && interval.start <= current.end) {
      current.end = Math.max(current.end, interval.end);
    } else {
      current = { ...interval };
    }
    longest = Math.max(longest, current.end - current.start);
  }
  return longest;
}

export function validatePriorPrice(input: PriorPriceInput): PriorPriceValidation {
  const {
    currentPricePaise,
    compareAtPaise,
    history,
    minDays = PRIOR_PRICE_MIN_DAYS,
    lookbackDays = PRIOR_PRICE_LOOKBACK_DAYS,
  } = input;
  const result = (reason: PriorPriceReason | null, qualifyingDays = 0): PriorPriceValidation => ({
    valid: reason === null,
    reason,
    qualifyingDays,
  });

  if (compareAtPaise === null || compareAtPaise === undefined) return result("no_compare_at");
  if (!isPaise(compareAtPaise) || !isPaise(currentPricePaise) || currentPricePaise < 0) {
    return result("invalid_amount");
  }
  if (compareAtPaise <= currentPricePaise) return result("not_higher_than_current");

  const now = toDate(input.now).getTime();
  const windowStart = now - lookbackDays * DAY_MS;
  const intervals: Interval[] = [];
  for (const entry of history) {
    if (entry.pricePaise !== compareAtPaise) continue;
    const from = safeTime(entry.effectiveFrom);
    const to = entry.effectiveTo === null ? now : safeTime(entry.effectiveTo);
    // Malformed rows earn no credit rather than failing the page.
    if (from === null || to === null || to < from) continue;
    const start = Math.max(from, windowStart);
    const end = Math.min(to, now);
    if (end > start) intervals.push({ start, end });
  }
  if (intervals.length === 0) return result("not_charged_in_lookback");

  const longest = longestRunMs(intervals);
  const qualifyingDays = Math.floor(longest / DAY_MS);
  return result(longest >= minDays * DAY_MS ? null : "charged_too_briefly", qualifyingDays);
}

/** Whole-percent discount, rounded DOWN so the saving is never overstated. */
export function discountPercent(compareAtPaise: Paise, pricePaise: Paise): number {
  if (!isPaise(compareAtPaise) || !isPaise(pricePaise) || compareAtPaise <= 0) return 0;
  if (pricePaise >= compareAtPaise || pricePaise < 0) return 0;
  return Math.floor(((compareAtPaise - pricePaise) * 100) / compareAtPaise);
}

export interface DisplayedDiscount {
  showCompareAt: boolean;
  compareAtPaise: Paise | null;
  savingPaise: Paise;
  discountPercent: number;
  reason: PriorPriceReason | null;
}

/** What the price component may render: the compare-at and saving only when validated. */
export function resolveDisplayedDiscount(input: PriorPriceInput): DisplayedDiscount {
  const validation = validatePriorPrice(input);
  if (!validation.valid || input.compareAtPaise == null) {
    return {
      showCompareAt: false,
      compareAtPaise: null,
      savingPaise: 0,
      discountPercent: 0,
      reason: validation.reason,
    };
  }
  return {
    showCompareAt: true,
    compareAtPaise: input.compareAtPaise,
    savingPaise: input.compareAtPaise - input.currentPricePaise,
    discountPercent: discountPercent(input.compareAtPaise, input.currentPricePaise),
    reason: null,
  };
}
