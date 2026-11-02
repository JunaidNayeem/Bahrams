import { assertPaise, formatINR, type Paise } from "./money";
import type { PincodeServiceability } from "./shipping";

/**
 * Cash on delivery is offered but steered: COD orders return to origin roughly ten times as
 * often as prepaid ones, so it is capped by order value and limited to serviceable pincodes,
 * and its fee is shown before the shopper chooses it.
 */
export interface CodSettings {
  enabled: boolean;
  /** Highest order value (excluding the COD fee) that may be paid on delivery. */
  maxOrderPaise: Paise;
  feePaise: Paise;
}

export const DEFAULT_COD_MAX_ORDER_PAISE: Paise = 500_000;

export const DEFAULT_COD_SETTINGS: CodSettings = {
  enabled: true,
  maxOrderPaise: DEFAULT_COD_MAX_ORDER_PAISE,
  // TODO(client): confirm the COD fee; the live value comes from the settings table.
  feePaise: 4_900,
};

export type CodIneligibilityReason =
  | "cod_disabled"
  | "order_above_limit"
  | "pincode_unknown"
  | "pincode_not_serviceable"
  | "cod_unavailable_at_pincode";

export interface CodEligibility {
  eligible: boolean;
  reasons: CodIneligibilityReason[];
  /** Always returned so the fee can be shown upfront next to the option. */
  feePaise: Paise;
  limitPaise: Paise;
}

export interface CodEligibilityInput {
  /** Order value before the COD fee is added. */
  orderValuePaise: Paise;
  pincode: PincodeServiceability | null;
  settings?: CodSettings;
}

export function codEligibility(input: CodEligibilityInput): CodEligibility {
  const { orderValuePaise, pincode, settings = DEFAULT_COD_SETTINGS } = input;
  assertPaise(orderValuePaise, "orderValuePaise");
  const reasons: CodIneligibilityReason[] = [];
  if (!settings.enabled) reasons.push("cod_disabled");
  if (orderValuePaise > settings.maxOrderPaise) reasons.push("order_above_limit");
  if (!pincode) reasons.push("pincode_unknown");
  else if (!pincode.serviceable) reasons.push("pincode_not_serviceable");
  else if (!pincode.codAvailable) reasons.push("cod_unavailable_at_pincode");
  return {
    eligible: reasons.length === 0,
    reasons,
    feePaise: settings.feePaise,
    limitPaise: settings.maxOrderPaise,
  };
}

/** Shopper-facing explanation for each reason; always points to a way to complete the order. */
export function codReasonMessage(
  reason: CodIneligibilityReason,
  settings: CodSettings = DEFAULT_COD_SETTINGS,
): string {
  switch (reason) {
    case "cod_disabled":
      return "Cash on delivery is not available right now. You can pay securely by UPI, card or netbanking.";
    case "order_above_limit":
      return `Cash on delivery is available on orders up to ${formatINR(settings.maxOrderPaise, { omitZeroPaise: true })}. Please pay online for this order.`;
    case "pincode_unknown":
      return "Enter your PIN code to check cash on delivery.";
    case "pincode_not_serviceable":
      return "We cannot deliver to this PIN code yet. Message us on WhatsApp and we will try to arrange it.";
    case "cod_unavailable_at_pincode":
      return "Our couriers do not collect cash at this PIN code. Please pay online.";
  }
}
