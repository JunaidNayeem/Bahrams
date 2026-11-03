import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { CartPricingSettings, PrepaidIncentive } from "@/lib/domain/cart";
import { createPublicClient } from "@/lib/supabase/public";

export const SETTINGS_TAG = "settings";

/** TODO(client): flat shipping fee below the free-shipping threshold; not yet in `settings`. */
const DEFAULT_SHIPPING_FEE_PAISE = 9900;

export interface LegalEntity {
  name: string;
  email?: string;
  gstin?: string | null;
  address?: string;
  phone?: string;
}

export interface GrievanceOfficer {
  name: string;
  email: string;
  phone?: string;
  hours?: string;
  address?: string;
}

export interface StoreSettings {
  codMaxOrderPaise: number;
  codFeePaise: number;
  freeShippingThresholdPaise: number | null;
  giftWrapPaise: number;
  shippingFeePaise: number;
  prepaidIncentive: PrepaidIncentive & { message?: string };
  returnWindowDays: number;
  legalEntity: LegalEntity;
  grievanceOfficer: GrievanceOfficer;
  privacyNoticeVersion: string;
}

/** Public settings (RLS exposes only `is_public` rows to anon). */
export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(SETTINGS_TAG);

  const { data, error } = await createPublicClient().from("settings").select("key, value");
  if (error) throw error;
  const s = Object.fromEntries(data.map((r) => [r.key, r.value])) as Record<string, unknown>;
  const num = (key: string, fallback: number) => (typeof s[key] === "number" ? (s[key] as number) : fallback);

  const incentive = (s.prepaid_incentive ?? { type: "none" }) as {
    type?: string;
    amount_paise?: number;
    percent?: number;
    message?: string;
  };
  const prepaidIncentive: StoreSettings["prepaidIncentive"] =
    incentive.type === "flat" && incentive.amount_paise
      ? { type: "flat", amountPaise: incentive.amount_paise, message: incentive.message }
      : incentive.type === "percentage" && incentive.percent
        ? { type: "percentage", percent: incentive.percent, message: incentive.message }
        : incentive.type === "free_shipping"
          ? { type: "free_shipping", message: incentive.message }
          : { type: "none" };

  return {
    codMaxOrderPaise: num("cod_max_order_paise", 500000),
    codFeePaise: num("cod_fee_paise", 4900),
    freeShippingThresholdPaise:
      typeof s.free_shipping_threshold_paise === "number" ? s.free_shipping_threshold_paise : null,
    giftWrapPaise: num("gift_wrap_paise", 9900),
    shippingFeePaise: num("shipping_fee_paise", DEFAULT_SHIPPING_FEE_PAISE),
    prepaidIncentive,
    returnWindowDays: num("return_window_days", 7),
    legalEntity: (s.legal_entity ?? { name: "Bahram Silks" }) as LegalEntity,
    grievanceOfficer: (s.grievance_officer ?? { name: "Grievance Officer", email: "grievance@bahramsilk.com" }) as GrievanceOfficer,
    privacyNoticeVersion: typeof s.privacy_notice_version === "string" ? s.privacy_notice_version : "draft",
  };
}

export function toCartPricingSettings(settings: StoreSettings): CartPricingSettings {
  return {
    shippingFeePaise: settings.shippingFeePaise,
    freeShippingThresholdPaise: settings.freeShippingThresholdPaise,
    codFeePaise: settings.codFeePaise,
    giftWrapFeePaise: settings.giftWrapPaise,
    prepaidIncentive: settings.prepaidIncentive,
  };
}
