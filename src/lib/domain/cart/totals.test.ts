import { describe, expect, it } from "vitest";
import {
  compareCodAndPrepaid,
  computeCartTotals,
  evaluateCoupon,
  type AutomaticOffer,
  type CartLineInput,
  type CartPricingSettings,
  type CartTotals,
  type CartTotalsInput,
} from ".";

const now = "2026-10-31T06:30:00Z";

const settings: CartPricingSettings = {
  shippingFeePaise: 9_900,
  freeShippingThresholdPaise: 500_000,
  codFeePaise: 4_900,
  giftWrapFeePaise: 14_900,
  prepaidIncentive: { type: "flat", amountPaise: 5_000 },
};

const saree: CartLineInput = { id: "saree", unitPricePaise: 450_000, quantity: 1, hsn: "5007" };
const fabric: CartLineInput = { id: "fabric", unitPricePaise: 120_000, quantity: 2.5, hsn: "5007" };
const stole: CartLineInput = { id: "stole", unitPricePaise: 220_000, quantity: 1, hsn: "6214" };

function totals(overrides: Partial<CartTotalsInput> = {}): CartTotals {
  return computeCartTotals({ lines: [saree], paymentMethod: null, settings, now, ...overrides });
}

/** Invariants every result must satisfy. */
function expectConsistent(result: CartTotals) {
  const sumOfLines = result.lines.reduce((s, l) => s + l.payablePaise, 0);
  expect(sumOfLines).toBe(result.grandTotalPaise);
  expect(result.grandTotalPaise).toBe(
    result.subtotalPaise -
      result.discountTotalPaise +
      result.shipping.chargedPaise +
      result.codFeePaise +
      result.giftWrapPaise,
  );
  expect(result.gst.grossPaise).toBe(result.grandTotalPaise);
  expect(result.gst.taxablePaise + result.gst.taxPaise).toBe(result.grandTotalPaise);
  const summed = result.breakdown
    .filter((item) => item.kind !== "grand_total" && item.kind !== "gst_included")
    .reduce((s, item) => s + item.amountPaise, 0);
  expect(summed).toBe(result.grandTotalPaise);
  for (const value of [
    result.grandTotalPaise,
    result.discountTotalPaise,
    ...result.lines.map((l) => l.payablePaise),
  ]) {
    expect(value).toBeGreaterThanOrEqual(0);
  }
}

describe("computeCartTotals: basics", () => {
  it("prices a single saree with shipping and included GST", () => {
    const result = totals();
    expectConsistent(result);
    expect(result.subtotalPaise).toBe(450_000);
    expect(result.shipping).toEqual({
      feePaise: 9_900,
      chargedPaise: 9_900,
      waivedBy: null,
      amountToFreeShippingPaise: 50_000,
    });
    expect(result.grandTotalPaise).toBe(459_900);
    expect(result.gst.supply).toBeNull();
    expect(result.gst.taxPaise).toBe(21_900); // 5 % IGST estimate on ₹4,599
    expect(result.breakdown.map((i) => i.kind)).toEqual([
      "subtotal",
      "shipping",
      "grand_total",
      "gst_included",
    ]);
  });

  it("multiplies fabric by metres", () => {
    const result = totals({ lines: [fabric] });
    expect(result.lines[0].lineTotalPaise).toBe(300_000);
    expectConsistent(result);
  });

  it("returns zeros for an empty cart and charges nothing", () => {
    const result = totals({ lines: [], paymentMethod: "cod", giftWrap: true });
    expectConsistent(result);
    expect(result.grandTotalPaise).toBe(0);
    expect(result.shipping.chargedPaise).toBe(0);
    expect(result.codFeePaise).toBe(0);
    expect(result.giftWrapPaise).toBe(0);
    expect(result.breakdown.map((i) => i.kind)).toEqual([
      "subtotal",
      "grand_total",
      "gst_included",
    ]);
  });

  it("splits GST by place of supply once the state is known", () => {
    const bihar = totals({ destinationStateCode: "10" });
    expect(bihar.gst.supply).toBe("intra_state");
    expect(bihar.gst.cgstPaise).toBe(bihar.gst.sgstPaise);
    expect(bihar.gst.igstPaise).toBe(0);
    const delhi = totals({ destinationStateCode: "07" });
    expect(delhi.gst.supply).toBe("inter_state");
    expect(delhi.gst.cgstPaise).toBe(0);
    expect(delhi.gst.igstPaise).toBe(delhi.gst.taxPaise);
  });

  it("uses a custom seller state and GST rules", () => {
    const result = totals({
      destinationStateCode: "07",
      settings: {
        ...settings,
        sellerStateCode: "07",
        gstRules: { "5007": { kind: "flat", ratePercent: 12 } },
      },
    });
    expect(result.gst.supply).toBe("intra_state");
    expect(result.lines[0].gst.ratePercent).toBe(12);
  });
});

describe("free shipping", () => {
  it("waives shipping at the threshold", () => {
    const result = totals({ lines: [saree, fabric] });
    expect(result.shipping).toMatchObject({
      chargedPaise: 0,
      waivedBy: "threshold",
      amountToFreeShippingPaise: 0,
    });
    expectConsistent(result);
  });

  it("never offers free shipping when no threshold is set", () => {
    const result = totals({
      lines: [saree, fabric],
      settings: { ...settings, freeShippingThresholdPaise: null },
    });
    expect(result.shipping).toMatchObject({
      chargedPaise: 9_900,
      waivedBy: null,
      amountToFreeShippingPaise: null,
    });
  });

  it("tests the threshold after coupons", () => {
    const result = totals({
      lines: [{ ...saree, unitPricePaise: 520_000 }],
      coupon: { code: "FESTIVE10", type: "percentage", value: 10 },
    });
    expect(result.shipping.waivedBy).toBeNull();
    expect(result.shipping.amountToFreeShippingPaise).toBe(32_000);
  });

  it("does not let the prepaid saving cost the shopper free shipping", () => {
    const result = totals({ lines: [{ ...saree, unitPricePaise: 500_000 }], paymentMethod: "upi" });
    expect(result.prepaidDiscountPaise).toBe(5_000);
    expect(result.shipping.waivedBy).toBe("threshold");
    expectConsistent(result);
  });
});

describe("coupons", () => {
  it("applies a percentage coupon with a cap", () => {
    const result = totals({
      coupon: { code: "SILK15", type: "percentage", value: 15, maxDiscountPaise: 50_000 },
    });
    expect(result.coupon).toMatchObject({ applied: true, discountPaise: 50_000 });
    expect(result.breakdown).toContainEqual({
      kind: "coupon",
      label: "Coupon SILK15",
      amountPaise: -50_000,
    });
    expectConsistent(result);
  });

  it("applies an uncapped percentage coupon", () => {
    expect(
      totals({ coupon: { code: "TEN", type: "percentage", value: 10 } }).coupon?.discountPaise,
    ).toBe(45_000);
  });

  it("applies a flat coupon but never below zero", () => {
    expect(
      totals({ coupon: { code: "FLAT500", type: "flat", value: 50_000 } }).coupon?.discountPaise,
    ).toBe(50_000);
    const huge = totals({ coupon: { code: "HUGE", type: "flat", value: 9_000_000 } });
    expect(huge.coupon?.discountPaise).toBe(450_000);
    expect(huge.subtotalPaise - huge.discountTotalPaise).toBe(0);
    expectConsistent(huge);
  });

  it("applies a free-shipping coupon", () => {
    const result = totals({ coupon: { code: "SHIPFREE", type: "free_shipping", value: 0 } });
    expect(result.coupon).toMatchObject({ applied: true, discountPaise: 0, freeShipping: true });
    expect(result.shipping).toMatchObject({
      chargedPaise: 0,
      waivedBy: "coupon",
      amountToFreeShippingPaise: 0,
    });
    expect(result.breakdown.find((i) => i.kind === "coupon")).toBeUndefined();
    expectConsistent(result);
  });

  it("enforces the minimum order and reports the shortfall", () => {
    const result = totals({
      coupon: { code: "BIG", type: "flat", value: 50_000, minOrderPaise: 600_000 },
    });
    expect(result.coupon).toMatchObject({
      applied: false,
      reason: "below_minimum_order",
      shortfallPaise: 150_000,
    });
    expect(result.discountTotalPaise).toBe(0);
  });

  it("enforces the validity window", () => {
    expect(
      totals({
        coupon: { code: "SOON", type: "flat", value: 100, startsAt: "2026-11-01T00:00:00Z" },
      }).coupon?.reason,
    ).toBe("not_started");
    expect(
      totals({ coupon: { code: "OLD", type: "flat", value: 100, endsAt: "2026-10-30T00:00:00Z" } })
        .coupon?.reason,
    ).toBe("expired");
    expect(
      totals({
        coupon: {
          code: "NOW",
          type: "flat",
          value: 100,
          startsAt: "2026-10-01T00:00:00Z",
          endsAt: "2026-11-30T00:00:00Z",
        },
      }).coupon?.applied,
    ).toBe(true);
  });

  it.each([
    [{ type: "percentage", value: 0 }],
    [{ type: "percentage", value: 101 }],
    [{ type: "flat", value: -100 }],
    [{ type: "flat", value: 10.5 }],
  ] as const)("rejects invalid coupon values %j", (bad) => {
    expect(totals({ coupon: { code: "BAD", ...bad } }).coupon?.reason).toBe("invalid_value");
  });

  it("rejects coupons on an empty cart", () => {
    expect(
      evaluateCoupon(
        { code: "X", type: "flat", value: 100 },
        { subtotalPaise: 0, discountBasePaise: 0, now },
      ).reason,
    ).toBe("empty_cart");
  });
});

describe("automatic offers", () => {
  const twoSarees: AutomaticOffer = {
    id: "two-sarees",
    label: "Buy 2 sarees, save ₹500",
    discountFor: ({ lines }) => (lines.filter((l) => l.hsn === "5007").length >= 2 ? 50_000 : 0),
  };

  it("applies qualifying offers before the coupon", () => {
    const result = totals({
      lines: [saree, fabric],
      automaticOffers: [twoSarees],
      coupon: { code: "TEN", type: "percentage", value: 10 },
    });
    expect(result.offers).toEqual([
      { id: "two-sarees", label: "Buy 2 sarees, save ₹500", discountPaise: 50_000 },
    ]);
    expect(result.coupon?.discountPaise).toBe(70_000); // 10 % of ₹7,500 − ₹500
    expect(result.breakdown[1]).toEqual({
      kind: "offer",
      label: "Buy 2 sarees, save ₹500",
      amountPaise: -50_000,
    });
    expectConsistent(result);
  });

  it("skips offers that do not apply and clamps runaway offers", () => {
    expect(totals({ automaticOffers: [twoSarees] }).offers).toEqual([]);
    const runaway: AutomaticOffer = { id: "bug", label: "Bug", discountFor: () => 99_999_999 };
    const result = totals({ automaticOffers: [runaway, twoSarees] });
    expect(result.offers[0].discountPaise).toBe(450_000);
    expectConsistent(result);
  });

  it("rejects offers returning fractional paise", () => {
    const broken: AutomaticOffer = { id: "broken", label: "Broken", discountFor: () => 10.5 };
    expect(() => totals({ automaticOffers: [broken] })).toThrow(/broken must be a whole number/);
  });
});

describe("payment method: prepaid incentive and COD fee", () => {
  it("applies the prepaid saving only once the shopper pays online", () => {
    expect(totals({ paymentMethod: null }).prepaidDiscountPaise).toBe(0);
    const upi = totals({ paymentMethod: "upi" });
    expect(upi.prepaidDiscountPaise).toBe(5_000);
    expect(upi.breakdown).toContainEqual({
      kind: "prepaid_discount",
      label: "Online payment saving",
      amountPaise: -5_000,
    });
    expectConsistent(upi);
  });

  it("supports a capped percentage incentive", () => {
    const result = totals({
      paymentMethod: "card",
      settings: {
        ...settings,
        prepaidIncentive: { type: "percentage", percent: 5, maxDiscountPaise: 10_000 },
      },
    });
    expect(result.prepaidDiscountPaise).toBe(10_000);
    const uncapped = totals({
      paymentMethod: "card",
      settings: { ...settings, prepaidIncentive: { type: "percentage", percent: 2 } },
    });
    expect(uncapped.prepaidDiscountPaise).toBe(9_000);
  });

  it("supports free shipping as the prepaid incentive", () => {
    const prepaid = totals({
      paymentMethod: "netbanking",
      settings: { ...settings, prepaidIncentive: { type: "free_shipping" } },
    });
    expect(prepaid.shipping.waivedBy).toBe("prepaid");
    const cod = totals({
      paymentMethod: "cod",
      settings: { ...settings, prepaidIncentive: { type: "free_shipping" } },
    });
    expect(cod.shipping.waivedBy).toBeNull();
  });

  it("supports no incentive", () => {
    expect(
      totals({
        paymentMethod: "upi",
        settings: { ...settings, prepaidIncentive: { type: "none" } },
      }).prepaidDiscountPaise,
    ).toBe(0);
  });

  it("adds the COD fee as its own visible line", () => {
    const result = totals({ paymentMethod: "cod" });
    expect(result.codFeePaise).toBe(4_900);
    expect(result.prepaidDiscountPaise).toBe(0);
    expect(result.breakdown).toContainEqual({
      kind: "cod_fee",
      label: "Cash on delivery fee",
      amountPaise: 4_900,
    });
    expectConsistent(result);
  });

  it("compares COD and prepaid totals side by side", () => {
    const { prepaid, cod, prepaidSavingPaise } = compareCodAndPrepaid({
      lines: [saree],
      settings,
      now,
    });
    expect(prepaid.grandTotalPaise).toBe(454_900);
    expect(cod.grandTotalPaise).toBe(464_800);
    expect(prepaidSavingPaise).toBe(9_900);
  });
});

describe("gift wrap and GST allocation", () => {
  it("adds gift wrap as an itemised charge", () => {
    const result = totals({ giftWrap: true });
    expect(result.giftWrapPaise).toBe(14_900);
    expect(result.breakdown).toContainEqual({
      kind: "gift_wrap",
      label: "Gift wrap",
      amountPaise: 14_900,
    });
    expectConsistent(result);
  });

  it("spreads discounts and charges over lines in proportion to value", () => {
    const result = totals({
      lines: [saree, stole],
      coupon: { code: "FLAT", type: "flat", value: 67_000 },
      paymentMethod: "cod",
      giftWrap: true,
      destinationStateCode: "10",
    });
    expectConsistent(result);
    const [s, t] = result.lines;
    expect(s.discountPaise + t.discountPaise).toBe(67_000);
    expect(s.discountPaise).toBe(45_000);
    expect(result.shipping.waivedBy).toBe("threshold"); // ₹6,030 after the coupon
    expect(s.chargesPaise + t.chargesPaise).toBe(4_900 + 14_900);
  });

  it("rates apparel on the price actually paid after discounts", () => {
    const fullPrice = totals({ lines: [{ ...stole, unitPricePaise: 300_000 }] });
    expect(fullPrice.lines[0].gst.ratePercent).toBe(18);
    const discounted = totals({
      lines: [{ ...stole, unitPricePaise: 300_000 }],
      coupon: { code: "TWENTY", type: "percentage", value: 20 },
    });
    expect(discounted.lines[0].gst.ratePercent).toBe(5); // ₹2,400 paid
    expectConsistent(discounted);
  });

  it("allocates charges evenly when everything is discounted to zero", () => {
    const result = totals({
      lines: [saree, fabric],
      coupon: { code: "ALL", type: "percentage", value: 100 },
      paymentMethod: "cod",
    });
    expectConsistent(result);
    expect(result.grandTotalPaise).toBe(9_900 + 4_900);
    expect(result.lines.map((l) => l.chargesPaise)).toEqual([7_400, 7_400]);
  });

  it("throws for a product with an unknown HSN", () => {
    expect(() => totals({ lines: [{ ...saree, hsn: "9999" }] })).toThrow(/No GST rate/);
  });

  it("reconciles across many random carts", () => {
    let seed = 42;
    const random = (max: number) => {
      seed = (seed * 16_807) % 2_147_483_647;
      return seed % max;
    };
    for (let run = 0; run < 200; run++) {
      const lines: CartLineInput[] = Array.from({ length: 1 + random(4) }, (_, i) => ({
        id: `l${i}`,
        unitPricePaise: 1 + random(1_500_000),
        quantity: random(2) === 0 ? 1 + random(3) : (2 + random(10)) / 2,
        hsn: ["5007", "5208", "6214", "6304"][random(4)],
      }));
      const result = computeCartTotals({
        lines,
        paymentMethod: (["upi", "cod", null] as const)[random(3)],
        coupon: random(2)
          ? {
              code: "R",
              type: "percentage",
              value: 1 + random(40),
              maxDiscountPaise: random(200_000) || null,
            }
          : null,
        giftWrap: random(2) === 0,
        destinationStateCode: random(2) ? "10" : "27",
        settings: { ...settings, prepaidIncentive: { type: "percentage", percent: 3 } },
        now,
      });
      expectConsistent(result);
    }
  });
});
