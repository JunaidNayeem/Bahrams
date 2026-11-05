"use server";

import { getPincode } from "@/lib/data/product";
import { getStoreSettings } from "@/lib/data/settings";
import { formatINR } from "@/lib/domain/money";
import { estimateDelivery, formatDeliveryWindow } from "@/lib/domain/shipping";
import { pincodeSchema } from "@/lib/domain/validation";

export type DeliveryCheckResult =
  | {
      ok: true;
      pincode: string;
      place: string | null;
      window: string;
      madeToOrder: boolean;
      cod: string;
    }
  | { ok: false; message: string };

export async function checkDelivery(input: {
  pincode: string;
  madeToOrderLeadDays: number | null;
}): Promise<DeliveryCheckResult> {
  const parsed = pincodeSchema.safeParse(input.pincode);
  if (!parsed.success) return { ok: false, message: "Enter a valid 6-digit PIN code." };

  const [pin, settings] = await Promise.all([getPincode(parsed.data), getStoreSettings()]);
  const estimate = estimateDelivery({
    now: new Date(),
    pincode: pin ? { ...pin, serviceable: pin.prepaidAvailable || pin.codAvailable } : null,
    madeToOrderLeadDays: input.madeToOrderLeadDays ?? undefined,
  });
  if (!estimate.available) {
    return {
      ok: false,
      message:
        estimate.reason === "pincode_unknown"
          ? "We don't have courier data for this PIN code yet — message us on WhatsApp and we'll check."
          : "Our couriers don't deliver to this PIN code yet.",
    };
  }

  return {
    ok: true,
    pincode: parsed.data,
    place: pin ? [pin.city, pin.state].filter(Boolean).join(", ") || null : null,
    window: formatDeliveryWindow(estimate.deliveryEarliest, estimate.deliveryLatest),
    madeToOrder: estimate.madeToOrder,
    cod: pin?.codAvailable
      ? `Cash on delivery available on orders up to ${formatINR(settings.codMaxOrderPaise, { omitZeroPaise: true })} (fee ${formatINR(settings.codFeePaise, { omitZeroPaise: true })}).`
      : "Cash on delivery is not available here; pay online by UPI, card or netbanking.",
  };
}
