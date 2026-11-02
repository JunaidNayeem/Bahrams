import { assertPaise, type Paise } from "./money";
import {
  addIstBusinessDays,
  istDate,
  istParts,
  type BusinessCalendar,
  type DateInput,
  type IstDate,
} from "./time";

/** One row of the pincode serviceability table (from the courier aggregator or manual import). */
export interface PincodeServiceability {
  pincode: string;
  serviceable: boolean;
  codAvailable: boolean;
  /** Courier transit time from Bhagalpur, in business days. */
  estDaysMin: number;
  estDaysMax: number;
  city?: string | null;
  state?: string | null;
}

/** Ready stock leaves Bhagalpur within 24–48 hours (kickoff: Operations → Shipping). */
export const DISPATCH_BUSINESS_DAYS = { min: 1, max: 2 } as const;

export interface DeliveryEstimateInput {
  now: DateInput;
  pincode: PincodeServiceability | null;
  /** Weaver lead time for made-to-order pieces, in business days; 0 or omitted for ready stock. */
  madeToOrderLeadDays?: number;
  dispatchDays?: { min: number; max: number };
  calendar?: BusinessCalendar;
}

export type DeliveryEstimate =
  | {
      available: true;
      madeToOrder: boolean;
      dispatchEarliest: IstDate;
      dispatchLatest: IstDate;
      deliveryEarliest: IstDate;
      deliveryLatest: IstDate;
    }
  | { available: false; reason: "pincode_unknown" | "pincode_not_serviceable" };

/**
 * Honest delivery window: (made-to-order lead time) + dispatch 1–2 business days + courier
 * transit for the pincode. Transit is counted in business days because couriers rarely deliver
 * on Sundays, so the window errs late rather than early.
 */
export function estimateDelivery(input: DeliveryEstimateInput): DeliveryEstimate {
  const { pincode, calendar = {} } = input;
  if (!pincode) return { available: false, reason: "pincode_unknown" };
  if (!pincode.serviceable) return { available: false, reason: "pincode_not_serviceable" };

  const lead = input.madeToOrderLeadDays ?? 0;
  const dispatch = input.dispatchDays ?? DISPATCH_BUSINESS_DAYS;
  const add = (days: number) => addIstBusinessDays(input.now, days, calendar);
  const dispatchEarliest = add(lead + dispatch.min);
  const dispatchLatest = add(lead + dispatch.max);
  return {
    available: true,
    madeToOrder: lead > 0,
    dispatchEarliest: istDate(dispatchEarliest),
    dispatchLatest: istDate(dispatchLatest),
    deliveryEarliest: istDate(addIstBusinessDays(dispatchEarliest, pincode.estDaysMin, calendar)),
    deliveryLatest: istDate(addIstBusinessDays(dispatchLatest, pincode.estDaysMax, calendar)),
  };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-04" → "Wed, 4 Nov". */
export function formatIstDate(date: IstDate): string {
  const [year, month, day] = date.split("-").map(Number);
  // Noon IST keeps the weekday lookup well clear of the date boundary.
  const parts = istParts(Date.UTC(year, month - 1, day, 6, 30));
  return `${WEEKDAYS[parts.weekday]}, ${day} ${MONTHS[month - 1]}`;
}

/** "Wed, 4 Nov – Fri, 6 Nov", or a single date when the window is one day. */
export function formatDeliveryWindow(earliest: IstDate, latest: IstDate): string {
  return earliest === latest
    ? formatIstDate(earliest)
    : `${formatIstDate(earliest)} – ${formatIstDate(latest)}`;
}

/** Threshold null means free shipping is not offered. */
export function qualifiesForFreeShipping(
  amountPaise: Paise,
  thresholdPaise: Paise | null,
): boolean {
  assertPaise(amountPaise);
  return thresholdPaise !== null && amountPaise >= thresholdPaise;
}

/** How much more the shopper must add for free shipping; null when not offered, 0 once met. */
export function amountToFreeShipping(
  amountPaise: Paise,
  thresholdPaise: Paise | null,
): Paise | null {
  assertPaise(amountPaise);
  if (thresholdPaise === null) return null;
  return Math.max(0, thresholdPaise - amountPaise);
}
