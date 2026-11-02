import { describe, expect, it } from "vitest";
import { RESERVATION_STATUSES } from "../enums";
import {
  RESERVATION_ACTIONS,
  RESERVATION_TTL_MINUTES,
  availableQuantity,
  canReserve,
  isReservationExpired,
  nextReservationStatus,
  reservationActionFor,
  reservationExpiresAt,
  resolvePaymentCapture,
} from "./reservations";

const now = "2026-10-31T06:30:00Z";

describe("reservation timing", () => {
  it("expires 15 minutes after checkout starts", () => {
    expect(RESERVATION_TTL_MINUTES).toBe(15);
    expect(reservationExpiresAt(now).toISOString()).toBe("2026-10-31T06:45:00.000Z");
    expect(reservationExpiresAt(now, 5).toISOString()).toBe("2026-10-31T06:35:00.000Z");
  });

  it("is expired at and after the expiry instant", () => {
    const expiresAt = reservationExpiresAt(now);
    expect(isReservationExpired(expiresAt, "2026-10-31T06:44:59Z")).toBe(false);
    expect(isReservationExpired(expiresAt, "2026-10-31T06:45:00Z")).toBe(true);
  });
});

describe("availability", () => {
  it("subtracts active reservations and never goes negative", () => {
    expect(availableQuantity(1, 0)).toBe(1);
    expect(availableQuantity(1, 1)).toBe(0);
    expect(availableQuantity(1, 2)).toBe(0);
    expect(availableQuantity(12.5, 2.5)).toBe(10);
    expect(availableQuantity(0.3, 0.1)).toBe(0.2);
  });

  it("never double-reserves a one-of-a-kind piece", () => {
    expect(canReserve({ onHand: 1, reserved: 0, requested: 1 })).toEqual({
      ok: true,
      available: 1,
      reason: null,
    });
    expect(canReserve({ onHand: 1, reserved: 1, requested: 1 })).toEqual({
      ok: false,
      available: 0,
      reason: "insufficient_stock",
    });
  });

  it("reserves fabric in metres", () => {
    expect(canReserve({ onHand: 10, reserved: 7.5, requested: 2.5 }).ok).toBe(true);
    expect(canReserve({ onHand: 10, reserved: 7.5, requested: 3 }).ok).toBe(false);
  });

  it("rejects invalid requests", () => {
    expect(canReserve({ onHand: 5, reserved: 0, requested: 0 }).reason).toBe("invalid_quantity");
    expect(canReserve({ onHand: 5, reserved: 0, requested: Number.NaN }).reason).toBe(
      "invalid_quantity",
    );
  });
});

describe("when to reserve, commit and release", () => {
  it("reserves at checkout start, not add-to-cart", () => {
    expect(reservationActionFor("added_to_cart")).toBe("none");
    expect(reservationActionFor("checkout_started")).toBe("reserve");
  });

  it("commits on payment capture or COD confirmation", () => {
    expect(reservationActionFor("payment_captured")).toBe("commit");
    expect(reservationActionFor("cod_confirmed")).toBe("commit");
  });

  it("releases on failure, abandonment, cancellation and expiry", () => {
    expect(reservationActionFor("payment_failed")).toBe("release");
    expect(reservationActionFor("checkout_abandoned")).toBe("release");
    expect(reservationActionFor("order_cancelled")).toBe("release");
    expect(reservationActionFor("ttl_elapsed")).toBe("expire");
    expect(Object.keys(RESERVATION_ACTIONS)).toHaveLength(8);
  });

  it("moves only active reservations to a final status", () => {
    expect(nextReservationStatus("active", "commit")).toBe("committed");
    expect(nextReservationStatus("active", "release")).toBe("released");
    expect(nextReservationStatus("active", "expire")).toBe("expired");
    expect(nextReservationStatus("active", "reserve")).toBeNull();
    expect(nextReservationStatus("active", "none")).toBeNull();
    for (const status of RESERVATION_STATUSES.filter((s) => s !== "active")) {
      expect(nextReservationStatus(status, "commit")).toBeNull();
    }
  });
});

describe("resolvePaymentCapture", () => {
  const base = { expiresAt: "2026-10-31T06:45:00Z", onHand: 1, reserved: 1, quantity: 1 };

  it("commits a live reservation", () => {
    expect(
      resolvePaymentCapture({
        ...base,
        reservationStatus: "active",
        capturedAt: "2026-10-31T06:40:00Z",
      }),
    ).toBe("commit");
  });

  it("ignores a repeated capture webhook", () => {
    expect(
      resolvePaymentCapture({ ...base, reservationStatus: "committed", capturedAt: now }),
    ).toBe("already_committed");
  });

  it("re-reserves after a late capture if the piece is still free", () => {
    expect(
      resolvePaymentCapture({
        ...base,
        reservationStatus: "active",
        capturedAt: "2026-10-31T06:50:00Z",
      }),
    ).toBe("reserve_and_commit");
    expect(
      resolvePaymentCapture({
        ...base,
        reservationStatus: "expired",
        reserved: 0,
        capturedAt: "2026-10-31T06:50:00Z",
      }),
    ).toBe("reserve_and_commit");
  });

  it("refunds a late capture if someone else now holds the piece", () => {
    expect(
      resolvePaymentCapture({
        ...base,
        reservationStatus: "released",
        reserved: 1,
        capturedAt: "2026-10-31T06:50:00Z",
      }),
    ).toBe("refund_and_cancel");
    expect(
      resolvePaymentCapture({
        ...base,
        reservationStatus: "active",
        reserved: 2,
        capturedAt: "2026-10-31T06:50:00Z",
      }),
    ).toBe("refund_and_cancel");
  });
});
