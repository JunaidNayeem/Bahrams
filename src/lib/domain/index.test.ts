import { describe, expect, it } from "vitest";
import * as domain from ".";

describe("domain barrel", () => {
  it("re-exports every module's public API", () => {
    for (const name of [
      "ORDER_STATUSES",
      "formatINR",
      "quantityRuleFor",
      "lineTotal",
      "validatePriorPrice",
      "splitGstInclusive",
      "isValidGstin",
      "computeCartTotals",
      "codEligibility",
      "estimateDelivery",
      "returnEligibility",
      "canTransition",
      "canReserve",
      "computeClaims",
      "grievanceSla",
      "latestConsentState",
      "DARK_PATTERN_CHECKLIST",
      "checkoutInputSchema",
      "formatOrderNumber",
      "slugify",
      "istDate",
    ]) {
      expect(domain, name).toHaveProperty(name);
    }
  });
});
