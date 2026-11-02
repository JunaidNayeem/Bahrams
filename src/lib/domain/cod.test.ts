import { describe, expect, it } from "vitest";
import {
  DEFAULT_COD_MAX_ORDER_PAISE,
  DEFAULT_COD_SETTINGS,
  codEligibility,
  codReasonMessage,
  type CodIneligibilityReason,
} from "./cod";
import type { PincodeServiceability } from "./shipping";

const pincode: PincodeServiceability = {
  pincode: "812001",
  serviceable: true,
  codAvailable: true,
  estDaysMin: 2,
  estDaysMax: 4,
};

describe("codEligibility", () => {
  it("defaults to a ₹5,000 limit", () => {
    expect(DEFAULT_COD_MAX_ORDER_PAISE).toBe(500_000);
    expect(DEFAULT_COD_SETTINGS.maxOrderPaise).toBe(500_000);
  });

  it("allows COD within the limit on a serviceable pincode, with the fee upfront", () => {
    expect(codEligibility({ orderValuePaise: 500_000, pincode })).toEqual({
      eligible: true,
      reasons: [],
      feePaise: DEFAULT_COD_SETTINGS.feePaise,
      limitPaise: 500_000,
    });
  });

  it("refuses orders above the limit", () => {
    expect(codEligibility({ orderValuePaise: 500_001, pincode })).toMatchObject({
      eligible: false,
      reasons: ["order_above_limit"],
    });
  });

  it("refuses unknown, unserviceable and cash-free pincodes", () => {
    expect(codEligibility({ orderValuePaise: 1000, pincode: null }).reasons).toEqual([
      "pincode_unknown",
    ]);
    expect(
      codEligibility({ orderValuePaise: 1000, pincode: { ...pincode, serviceable: false } })
        .reasons,
    ).toEqual(["pincode_not_serviceable"]);
    expect(
      codEligibility({ orderValuePaise: 1000, pincode: { ...pincode, codAvailable: false } })
        .reasons,
    ).toEqual(["cod_unavailable_at_pincode"]);
  });

  it("collects every reason and honours settings", () => {
    const settings = { enabled: false, maxOrderPaise: 300_000, feePaise: 0 };
    expect(codEligibility({ orderValuePaise: 400_000, pincode: null, settings })).toEqual({
      eligible: false,
      reasons: ["cod_disabled", "order_above_limit", "pincode_unknown"],
      feePaise: 0,
      limitPaise: 300_000,
    });
  });

  it("rejects fractional order values", () => {
    expect(() => codEligibility({ orderValuePaise: 10.5, pincode })).toThrow(RangeError);
  });
});

describe("codReasonMessage", () => {
  it("states the limit in rupees", () => {
    expect(codReasonMessage("order_above_limit")).toBe(
      "Cash on delivery is available on orders up to ₹5,000. Please pay online for this order.",
    );
  });

  it("has copy for every reason", () => {
    const reasons: CodIneligibilityReason[] = [
      "cod_disabled",
      "order_above_limit",
      "pincode_unknown",
      "pincode_not_serviceable",
      "cod_unavailable_at_pincode",
    ];
    for (const reason of reasons) expect(codReasonMessage(reason).length).toBeGreaterThan(10);
  });
});
