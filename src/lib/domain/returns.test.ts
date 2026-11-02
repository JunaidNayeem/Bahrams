import { describe, expect, it } from "vitest";
import {
  RETURN_CONDITIONS,
  RETURN_RESOLUTION_PREFERENCE,
  RETURN_WINDOW_DAYS,
  returnEligibility,
  returnExclusions,
  returnReasonMessage,
  returnWindowEndsAt,
  type ReturnIneligibilityReason,
} from "./returns";

const saree = { sellUnit: "piece" as const };
const deliveredAt = "2026-10-20T08:00:00Z"; // 13:30 IST, 20 Oct

describe("return window", () => {
  it("is 7 days from delivery, to the end of the 7th day in IST", () => {
    expect(RETURN_WINDOW_DAYS).toBe(7);
    expect(returnWindowEndsAt(deliveredAt).toISOString()).toBe("2026-10-27T18:29:59.999Z");
  });

  it("is open on the last day and closed just after", () => {
    const base = { item: saree, orderStatus: "delivered" as const, deliveredAt };
    expect(returnEligibility({ ...base, now: "2026-10-27T18:29:59Z" })).toMatchObject({
      eligible: true,
      reasons: [],
    });
    expect(returnEligibility({ ...base, now: "2026-10-27T18:30:00Z" })).toMatchObject({
      eligible: false,
      reasons: ["window_closed"],
    });
  });

  it("is not available before delivery", () => {
    expect(
      returnEligibility({
        item: saree,
        orderStatus: "shipped",
        deliveredAt: null,
        now: deliveredAt,
      }),
    ).toEqual({
      eligible: false,
      reasons: ["not_delivered"],
      windowEndsAt: null,
    });
    expect(
      returnEligibility({
        item: saree,
        orderStatus: "delivered",
        deliveredAt: null,
        now: deliveredAt,
      }).reasons,
    ).toEqual(["not_delivered"]);
  });
});

describe("exclusions", () => {
  it("excludes fabric cut by the metre, stitched-to-measure and final-sale items", () => {
    expect(returnExclusions({ sellUnit: "metre" })).toEqual(["custom_cut_fabric"]);
    expect(returnExclusions({ sellUnit: "piece", customCut: true })).toEqual(["custom_cut_fabric"]);
    expect(
      returnExclusions({ sellUnit: "piece", stitchedToMeasure: true, finalSale: true }),
    ).toEqual(["stitched_to_measure", "final_sale"]);
    expect(returnExclusions(saree)).toEqual([]);
  });

  it("combines exclusions with window reasons", () => {
    expect(
      returnEligibility({
        item: { sellUnit: "metre" },
        orderStatus: "delivered",
        deliveredAt,
        now: "2026-12-01T00:00:00Z",
      }).reasons,
    ).toEqual(["window_closed", "custom_cut_fabric"]);
  });
});

describe("policy constants and copy", () => {
  it("prefers exchange, then store credit, then refund", () => {
    expect(RETURN_RESOLUTION_PREFERENCE).toEqual(["exchange", "store_credit", "refund_to_source"]);
    expect(RETURN_CONDITIONS.length).toBeGreaterThan(0);
  });

  it("has a message for every reason", () => {
    const reasons: ReturnIneligibilityReason[] = [
      "not_delivered",
      "window_closed",
      "custom_cut_fabric",
      "stitched_to_measure",
      "final_sale",
    ];
    for (const reason of reasons) expect(returnReasonMessage(reason)).toMatch(/\.$/);
    expect(returnReasonMessage("window_closed")).toContain("7-day");
  });
});
