import type { ReservationStatus } from "../enums";
import { addMinutes, toDate, type DateInput } from "../time";

/**
 * One-of-a-kind handloom pieces must never be sold twice. Stock is reserved when checkout
 * starts (not on add-to-cart, which would let carts hoard pieces), released automatically if
 * payment is not completed within RESERVATION_TTL_MINUTES, and committed on payment capture or
 * COD confirmation. The database enforces this atomically; these are the rules it implements.
 */
export const RESERVATION_TTL_MINUTES = 15;

/** Fabric is stocked in metres (0.5 m steps); keep arithmetic on a 0.001 grid to avoid float drift. */
function tidy(quantity: number): number {
  return Math.round(quantity * 1000) / 1000;
}

export function reservationExpiresAt(now: DateInput, ttlMinutes = RESERVATION_TTL_MINUTES): Date {
  return addMinutes(now, ttlMinutes);
}

export function isReservationExpired(expiresAt: DateInput, now: DateInput): boolean {
  return toDate(now).getTime() >= toDate(expiresAt).getTime();
}

/** Sellable quantity: on hand minus active reservations, never below zero. */
export function availableQuantity(onHand: number, reserved: number): number {
  return Math.max(0, tidy(onHand - reserved));
}

export type ReserveRefusal = "invalid_quantity" | "insufficient_stock";

export function canReserve(input: { onHand: number; reserved: number; requested: number }): {
  ok: boolean;
  available: number;
  reason: ReserveRefusal | null;
} {
  const available = availableQuantity(input.onHand, input.reserved);
  if (!Number.isFinite(input.requested) || input.requested <= 0) {
    return { ok: false, available, reason: "invalid_quantity" };
  }
  const ok = tidy(input.requested) <= available;
  return { ok, available, reason: ok ? null : "insufficient_stock" };
}

export type ReservationEvent =
  | "added_to_cart"
  | "checkout_started"
  | "payment_captured"
  | "cod_confirmed"
  | "payment_failed"
  | "checkout_abandoned"
  | "ttl_elapsed"
  | "order_cancelled";

export type ReservationAction = "none" | "reserve" | "commit" | "release" | "expire";

/** What the stock layer should do for each checkout event. */
export const RESERVATION_ACTIONS: Readonly<Record<ReservationEvent, ReservationAction>> = {
  added_to_cart: "none",
  checkout_started: "reserve",
  payment_captured: "commit",
  cod_confirmed: "commit",
  payment_failed: "release",
  checkout_abandoned: "release",
  ttl_elapsed: "expire",
  order_cancelled: "release",
};

export function reservationActionFor(event: ReservationEvent): ReservationAction {
  return RESERVATION_ACTIONS[event];
}

/** Only an active reservation can change; committed, released and expired are final. */
export function nextReservationStatus(
  current: ReservationStatus,
  action: ReservationAction,
): ReservationStatus | null {
  if (current !== "active") return null;
  switch (action) {
    case "commit":
      return "committed";
    case "release":
      return "released";
    case "expire":
      return "expired";
    default:
      return null;
  }
}

/**
 * Payment can be captured after the reservation lapsed (slow UPI approval). Commit if still
 * active; otherwise take the stock again only if it is still free, else refund and cancel so
 * the piece is never double-sold.
 */
export type CaptureResolution =
  "already_committed" | "commit" | "reserve_and_commit" | "refund_and_cancel";

export function resolvePaymentCapture(input: {
  reservationStatus: ReservationStatus;
  expiresAt: DateInput;
  capturedAt: DateInput;
  onHand: number;
  reserved: number;
  quantity: number;
}): CaptureResolution {
  // Gateways retry webhooks; a repeated capture event must not commit twice.
  if (input.reservationStatus === "committed") return "already_committed";
  if (
    input.reservationStatus === "active" &&
    !isReservationExpired(input.expiresAt, input.capturedAt)
  ) {
    return "commit";
  }
  // An active-but-expired reservation still counts in `reserved`; exclude our own hold.
  const reservedByOthers =
    input.reservationStatus === "active" ? input.reserved - input.quantity : input.reserved;
  return canReserve({ onHand: input.onHand, reserved: reservedByOthers, requested: input.quantity })
    .ok
    ? "reserve_and_commit"
    : "refund_and_cancel";
}
