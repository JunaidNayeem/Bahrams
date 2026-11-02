import { describe, expect, it } from "vitest";
import {
  DISPATCH_BUSINESS_DAYS,
  amountToFreeShipping,
  estimateDelivery,
  formatDeliveryWindow,
  formatIstDate,
  qualifiesForFreeShipping,
  type PincodeServiceability,
} from "./shipping";

const delhi: PincodeServiceability = {
  pincode: "110001",
  serviceable: true,
  codAvailable: true,
  estDaysMin: 2,
  estDaysMax: 4,
};
// Wednesday 28 Oct 2026, 11:00 IST
const wednesday = "2026-10-28T05:30:00Z";

describe("estimateDelivery", () => {
  it("adds 1–2 business days dispatch and courier transit, skipping Sundays", () => {
    expect(DISPATCH_BUSINESS_DAYS).toEqual({ min: 1, max: 2 });
    expect(estimateDelivery({ now: wednesday, pincode: delhi })).toEqual({
      available: true,
      madeToOrder: false,
      dispatchEarliest: "2026-10-29",
      dispatchLatest: "2026-10-30",
      deliveryEarliest: "2026-10-31",
      deliveryLatest: "2026-11-04", // Fri 30 Oct + 4 business days, skipping Sun 1 Nov
    });
  });

  it("adds the weaver lead time for made-to-order pieces", () => {
    const estimate = estimateDelivery({ now: wednesday, pincode: delhi, madeToOrderLeadDays: 10 });
    expect(estimate).toMatchObject({
      available: true,
      madeToOrder: true,
      dispatchEarliest: "2026-11-10",
    });
  });

  it("respects holidays and custom dispatch windows", () => {
    const estimate = estimateDelivery({
      now: wednesday,
      pincode: delhi,
      dispatchDays: { min: 1, max: 1 },
      calendar: { holidays: ["2026-10-29"] },
    });
    expect(estimate).toMatchObject({
      dispatchEarliest: "2026-10-30",
      dispatchLatest: "2026-10-30",
    });
  });

  it("explains when no estimate is possible", () => {
    expect(estimateDelivery({ now: wednesday, pincode: null })).toEqual({
      available: false,
      reason: "pincode_unknown",
    });
    expect(estimateDelivery({ now: wednesday, pincode: { ...delhi, serviceable: false } })).toEqual(
      {
        available: false,
        reason: "pincode_not_serviceable",
      },
    );
  });
});

describe("formatting", () => {
  it("formats IST dates and windows", () => {
    expect(formatIstDate("2026-11-04")).toBe("Wed, 4 Nov");
    expect(formatIstDate("2027-01-01")).toBe("Fri, 1 Jan");
    expect(formatDeliveryWindow("2026-11-04", "2026-11-06")).toBe("Wed, 4 Nov – Fri, 6 Nov");
    expect(formatDeliveryWindow("2026-11-04", "2026-11-04")).toBe("Wed, 4 Nov");
  });
});

describe("free shipping threshold", () => {
  it("qualifies at or above the threshold", () => {
    expect(qualifiesForFreeShipping(500_000, 500_000)).toBe(true);
    expect(qualifiesForFreeShipping(499_999, 500_000)).toBe(false);
    expect(qualifiesForFreeShipping(10_000_000, null)).toBe(false);
  });

  it("reports how much more to add", () => {
    expect(amountToFreeShipping(450_000, 500_000)).toBe(50_000);
    expect(amountToFreeShipping(600_000, 500_000)).toBe(0);
    expect(amountToFreeShipping(600_000, null)).toBeNull();
    expect(() => amountToFreeShipping(1.5, 100)).toThrow(RangeError);
  });
});
