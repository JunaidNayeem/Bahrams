import { describe, expect, it } from "vitest";
import {
  PRIOR_PRICE_LOOKBACK_DAYS,
  PRIOR_PRICE_MIN_DAYS,
  discountPercent,
  lineTotal,
  resolveBulkTier,
  resolveDisplayedDiscount,
  validateBulkTiers,
  validatePriorPrice,
  type PriceHistoryEntry,
} from ".";

describe("lineTotal", () => {
  it("multiplies price by pieces or metres", () => {
    expect(lineTotal(480_000, 2)).toBe(960_000);
    expect(lineTotal(129_900, 2.5)).toBe(324_750);
    expect(lineTotal(333, 1.5)).toBe(500); // 499.5 → 500
  });

  it("rejects invalid prices and quantities", () => {
    expect(() => lineTotal(-1, 1)).toThrow(RangeError);
    expect(() => lineTotal(10.5, 1)).toThrow(RangeError);
    expect(() => lineTotal(100, 0)).toThrow(RangeError);
    expect(() => lineTotal(100, Number.NaN)).toThrow(RangeError);
  });
});

describe("bulk tiers", () => {
  const base = 120_000; // ₹1,200 per metre
  const tiers = [
    { minQuantity: 20, unitPricePaise: 95_000 },
    { minQuantity: 5, unitPricePaise: 110_000 },
  ];

  it("validates well-formed tiers", () => {
    expect(validateBulkTiers(base, tiers)).toEqual({ valid: true, reason: null });
    expect(validateBulkTiers(base, [])).toEqual({ valid: true, reason: null });
  });

  it.each([
    [[{ minQuantity: 1, unitPricePaise: 100_000 }], "invalid_min_quantity"],
    [[{ minQuantity: 5, unitPricePaise: 0 }], "invalid_price"],
    [[{ minQuantity: 5, unitPricePaise: 100.5 }], "invalid_price"],
    [
      [
        { minQuantity: 5, unitPricePaise: 110_000 },
        { minQuantity: 5, unitPricePaise: 100_000 },
      ],
      "duplicate_min_quantity",
    ],
    [[{ minQuantity: 5, unitPricePaise: 120_000 }], "price_not_below_base"],
    [
      [
        { minQuantity: 5, unitPricePaise: 100_000 },
        { minQuantity: 10, unitPricePaise: 105_000 },
      ],
      "price_not_decreasing",
    ],
  ])("flags %j as %s", (bad, reason) => {
    expect(validateBulkTiers(base, bad)).toEqual({ valid: false, reason });
  });

  it("uses the base price below the first tier and points to the next", () => {
    expect(resolveBulkTier(base, tiers, 3)).toEqual({
      unitPricePaise: base,
      tier: null,
      next: { tier: tiers[1], quantityNeeded: 2, savingPerUnitPaise: 10_000 },
    });
  });

  it("applies the best qualifying tier", () => {
    expect(resolveBulkTier(base, tiers, 5)).toMatchObject({
      unitPricePaise: 110_000,
      tier: tiers[1],
    });
    expect(resolveBulkTier(base, tiers, 25)).toMatchObject({ unitPricePaise: 95_000, next: null });
    expect(resolveBulkTier(base, tiers, 19.5).next).toMatchObject({ quantityNeeded: 0.5 });
  });

  it("ignores a misconfigured tier that would raise the price", () => {
    const result = resolveBulkTier(base, [{ minQuantity: 5, unitPricePaise: 130_000 }], 10);
    expect(result).toEqual({ unitPricePaise: base, tier: null, next: null });
  });
});

describe("prior price (E-Commerce Amendment Rules 2026)", () => {
  const now = "2026-10-31T06:30:00Z";
  const daysAgo = (days: number) => new Date(Date.parse(now) - days * 86_400_000).toISOString();
  const current = 450_000;
  const genuine: PriceHistoryEntry[] = [
    { pricePaise: 520_000, effectiveFrom: daysAgo(40), effectiveTo: daysAgo(10) },
    { pricePaise: current, effectiveFrom: daysAgo(10), effectiveTo: null },
  ];

  it("uses the statutory constants", () => {
    expect(PRIOR_PRICE_MIN_DAYS).toBe(7);
    expect(PRIOR_PRICE_LOOKBACK_DAYS).toBe(90);
  });

  it("accepts a compare-at that was really charged for 7+ days in the last 90", () => {
    expect(
      validatePriorPrice({
        currentPricePaise: current,
        compareAtPaise: 520_000,
        history: genuine,
        now,
      }),
    ).toEqual({
      valid: true,
      reason: null,
      qualifyingDays: 30,
    });
  });

  it("rejects a missing compare-at", () => {
    expect(
      validatePriorPrice({
        currentPricePaise: current,
        compareAtPaise: null,
        history: genuine,
        now,
      }).reason,
    ).toBe("no_compare_at");
    expect(
      validatePriorPrice({
        currentPricePaise: current,
        compareAtPaise: undefined,
        history: genuine,
        now,
      }).reason,
    ).toBe("no_compare_at");
  });

  it("rejects non-integer amounts", () => {
    expect(
      validatePriorPrice({ currentPricePaise: current, compareAtPaise: 1.5, history: genuine, now })
        .reason,
    ).toBe("invalid_amount");
    expect(
      validatePriorPrice({ currentPricePaise: -1, compareAtPaise: 520_000, history: genuine, now })
        .reason,
    ).toBe("invalid_amount");
  });

  it("rejects a compare-at not higher than the current price", () => {
    for (const compareAtPaise of [current, current - 1]) {
      expect(
        validatePriorPrice({ currentPricePaise: current, compareAtPaise, history: genuine, now })
          .reason,
      ).toBe("not_higher_than_current");
    }
  });

  it("rejects an invented price that never appears in history", () => {
    expect(
      validatePriorPrice({
        currentPricePaise: current,
        compareAtPaise: 600_000,
        history: genuine,
        now,
      }),
    ).toEqual({
      valid: false,
      reason: "not_charged_in_lookback",
      qualifyingDays: 0,
    });
  });

  it("rejects a price charged only before the 90-day lookback", () => {
    const old: PriceHistoryEntry[] = [
      { pricePaise: 520_000, effectiveFrom: daysAgo(200), effectiveTo: daysAgo(91) },
    ];
    expect(
      validatePriorPrice({ currentPricePaise: current, compareAtPaise: 520_000, history: old, now })
        .reason,
    ).toBe("not_charged_in_lookback");
  });

  it("counts only the part of a period inside the lookback", () => {
    const straddling: PriceHistoryEntry[] = [
      { pricePaise: 520_000, effectiveFrom: daysAgo(120), effectiveTo: daysAgo(85) },
    ];
    expect(
      validatePriorPrice({
        currentPricePaise: current,
        compareAtPaise: 520_000,
        history: straddling,
        now,
      }),
    ).toEqual({ valid: false, reason: "charged_too_briefly", qualifyingDays: 5 });
  });

  it("rejects a price inflated for under 7 days just before a 'sale'", () => {
    const pumped: PriceHistoryEntry[] = [
      { pricePaise: 450_000, effectiveFrom: daysAgo(60), effectiveTo: daysAgo(8) },
      { pricePaise: 650_000, effectiveFrom: daysAgo(8), effectiveTo: daysAgo(2) },
      { pricePaise: 450_000, effectiveFrom: daysAgo(2), effectiveTo: null },
    ];
    expect(
      validatePriorPrice({
        currentPricePaise: current,
        compareAtPaise: 650_000,
        history: pumped,
        now,
      }),
    ).toEqual({
      valid: false,
      reason: "charged_too_briefly",
      qualifyingDays: 6,
    });
  });

  it("requires one unbroken run, not separate short spells added up", () => {
    const spells: PriceHistoryEntry[] = [
      { pricePaise: 520_000, effectiveFrom: daysAgo(30), effectiveTo: daysAgo(26) },
      { pricePaise: 450_000, effectiveFrom: daysAgo(26), effectiveTo: daysAgo(20) },
      { pricePaise: 520_000, effectiveFrom: daysAgo(20), effectiveTo: daysAgo(16) },
    ];
    expect(
      validatePriorPrice({
        currentPricePaise: current,
        compareAtPaise: 520_000,
        history: spells,
        now,
      }).reason,
    ).toBe("charged_too_briefly");
  });

  it("merges back-to-back or overlapping rows at the same price", () => {
    const split: PriceHistoryEntry[] = [
      { pricePaise: 520_000, effectiveFrom: daysAgo(12), effectiveTo: daysAgo(8) },
      { pricePaise: 520_000, effectiveFrom: daysAgo(8), effectiveTo: daysAgo(4) },
      { pricePaise: 520_000, effectiveFrom: daysAgo(5), effectiveTo: daysAgo(3) },
    ];
    expect(
      validatePriorPrice({
        currentPricePaise: current,
        compareAtPaise: 520_000,
        history: split,
        now,
      }),
    ).toEqual({
      valid: true,
      reason: null,
      qualifyingDays: 9,
    });
  });

  it("ignores future-dated and malformed rows", () => {
    const junk: PriceHistoryEntry[] = [
      { pricePaise: 520_000, effectiveFrom: "garbage", effectiveTo: null },
      { pricePaise: 520_000, effectiveFrom: daysAgo(5), effectiveTo: daysAgo(20) },
      { pricePaise: 520_000, effectiveFrom: daysAgo(-1), effectiveTo: daysAgo(-30) },
      { pricePaise: 520_000, effectiveFrom: daysAgo(-5), effectiveTo: null },
    ];
    expect(
      validatePriorPrice({
        currentPricePaise: current,
        compareAtPaise: 520_000,
        history: junk,
        now,
      }).reason,
    ).toBe("not_charged_in_lookback");
  });

  it("supports custom thresholds", () => {
    const result = validatePriorPrice({
      currentPricePaise: current,
      compareAtPaise: 520_000,
      history: genuine,
      now,
      minDays: 31,
    });
    expect(result.reason).toBe("charged_too_briefly");
    expect(
      validatePriorPrice({
        currentPricePaise: current,
        compareAtPaise: 520_000,
        history: genuine,
        now,
        lookbackDays: 5,
      }).reason,
    ).toBe("not_charged_in_lookback");
  });
});

describe("discountPercent", () => {
  it("rounds down so the saving is never overstated", () => {
    expect(discountPercent(520_000, 450_000)).toBe(13); // 13.46 %
    expect(discountPercent(300_000, 200_001)).toBe(33); // 33.333 %
    expect(discountPercent(100_000, 50_000)).toBe(50);
    expect(discountPercent(100_000, 99_999)).toBe(0); // 0.001 %
  });

  it("returns 0 for nonsense inputs", () => {
    expect(discountPercent(0, 0)).toBe(0);
    expect(discountPercent(100, 100)).toBe(0);
    expect(discountPercent(100, 150)).toBe(0);
    expect(discountPercent(100, -1)).toBe(0);
    expect(discountPercent(100.5, 50)).toBe(0);
  });
});

describe("resolveDisplayedDiscount", () => {
  const now = "2026-10-31T06:30:00Z";
  const history: PriceHistoryEntry[] = [
    {
      pricePaise: 520_000,
      effectiveFrom: "2026-09-01T00:00:00Z",
      effectiveTo: "2026-10-20T00:00:00Z",
    },
  ];

  it("shows the compare-at and saving only when validated", () => {
    expect(
      resolveDisplayedDiscount({
        currentPricePaise: 450_000,
        compareAtPaise: 520_000,
        history,
        now,
      }),
    ).toEqual({
      showCompareAt: true,
      compareAtPaise: 520_000,
      savingPaise: 70_000,
      discountPercent: 13,
      reason: null,
    });
  });

  it("hides everything otherwise", () => {
    expect(
      resolveDisplayedDiscount({
        currentPricePaise: 450_000,
        compareAtPaise: 999_900,
        history,
        now,
      }),
    ).toEqual({
      showCompareAt: false,
      compareAtPaise: null,
      savingPaise: 0,
      discountPercent: 0,
      reason: "not_charged_in_lookback",
    });
  });
});
