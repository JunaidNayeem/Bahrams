import { describe, expect, it } from "vitest";
import { ORDER_STATUSES, type OrderStatus } from "../enums";
import {
  InvalidOrderTransitionError,
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  TERMINAL_ORDER_STATUSES,
  adminTaskFor,
  adminTaskOnCreate,
  assertTransition,
  canTransition,
  customerMessageFor,
  getTransition,
  initialOrderStatus,
  isCancellableByCustomer,
  isTerminal,
  nextStatuses,
  stockEffectFor,
} from "./state-machine";

/** The lifecycle exactly as the kickoff brief describes it. */
const EXPECTED: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["confirmed", "cancelled"],
  awaiting_cod_confirmation: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivery_failed", "delivered"],
  out_for_delivery: ["delivered", "delivery_failed"],
  delivery_failed: ["out_for_delivery", "rto"],
  delivered: ["return_requested"],
  return_requested: ["returned", "delivered"],
  rto: [],
  returned: [],
  cancelled: [],
};

describe("transition table", () => {
  it("covers all 12 statuses", () => {
    expect(ORDER_STATUSES).toHaveLength(12);
    expect(Object.keys(EXPECTED).sort()).toEqual([...ORDER_STATUSES].sort());
  });

  it.each(ORDER_STATUSES)("%s has exactly the allowed next statuses", (from) => {
    expect(nextStatuses(from).sort()).toEqual([...EXPECTED[from]].sort());
  });

  it("allows every listed edge and rejects every other pair", () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        const allowed = EXPECTED[from].includes(to);
        expect(canTransition(from, to), `${from} → ${to}`).toBe(allowed);
        if (allowed) expect(assertTransition(from, to)).toMatchObject({ from, to });
        else expect(() => assertTransition(from, to)).toThrow(InvalidOrderTransitionError);
      }
    }
  });

  it("has no duplicate edges", () => {
    const keys = ORDER_TRANSITIONS.map((t) => `${t.from}>${t.to}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("names the illegal move in the error", () => {
    expect(() => assertTransition("delivered", "shipped")).toThrow(
      "Order cannot move from delivered to shipped",
    );
    expect(() => assertTransition("packed", "cancelled", "customer")).toThrow(
      "customer cannot move an order from packed to cancelled",
    );
  });
});

describe("terminal states", () => {
  it("treats rto, returned and cancelled as terminal", () => {
    expect([...TERMINAL_ORDER_STATUSES].sort()).toEqual(["cancelled", "returned", "rto"]);
    expect(isTerminal("rto")).toBe(true);
    expect(isTerminal("delivered")).toBe(false);
  });
});

describe("actors", () => {
  it("lets customers cancel only before packing", () => {
    expect(isCancellableByCustomer("pending_payment")).toBe(true);
    expect(isCancellableByCustomer("awaiting_cod_confirmation")).toBe(true);
    expect(isCancellableByCustomer("confirmed")).toBe(true);
    expect(isCancellableByCustomer("packed")).toBe(false);
    expect(isCancellableByCustomer("shipped")).toBe(false);
  });

  it("filters next statuses by actor", () => {
    expect(nextStatuses("delivered", "customer")).toEqual(["return_requested"]);
    expect(nextStatuses("return_requested", "customer")).toEqual([]);
    expect(nextStatuses("pending_payment", "system").sort()).toEqual(["cancelled", "confirmed"]);
    expect(canTransition("pending_payment", "confirmed", "customer")).toBe(false);
    expect(assertTransition("confirmed", "packed", "staff").to).toBe("packed");
  });
});

describe("side effects", () => {
  it("sends the customer a message on every transition", () => {
    for (const t of ORDER_TRANSITIONS) expect(customerMessageFor(t.from, t.to)).toBeTruthy();
    expect(customerMessageFor("return_requested", "delivered")).toBe("return_rejected");
    expect(customerMessageFor("delivered", "shipped")).toBeNull();
  });

  it("creates admin tasks where staff must act next", () => {
    expect(adminTaskFor("pending_payment", "confirmed")).toBe("pack_order");
    expect(adminTaskFor("awaiting_cod_confirmation", "confirmed")).toBe("pack_order");
    expect(adminTaskFor("confirmed", "packed")).toBe("book_shipment");
    expect(adminTaskFor("confirmed", "cancelled")).toBe("refund_cancelled_order");
    expect(adminTaskFor("shipped", "delivery_failed")).toBe("resolve_ndr");
    expect(adminTaskFor("out_for_delivery", "delivery_failed")).toBe("resolve_ndr");
    expect(adminTaskFor("delivery_failed", "rto")).toBe("qc_rto_parcel");
    expect(adminTaskFor("delivered", "return_requested")).toBe("review_return_request");
    expect(adminTaskFor("return_requested", "returned")).toBe("issue_refund_or_credit");
    expect(adminTaskFor("packed", "shipped")).toBeNull();
    expect(adminTaskFor("rto", "confirmed")).toBeNull();
  });

  it("raises a COD confirmation task when a COD order is created", () => {
    expect(initialOrderStatus("cod")).toBe("awaiting_cod_confirmation");
    expect(initialOrderStatus("upi")).toBe("pending_payment");
    expect(adminTaskOnCreate("awaiting_cod_confirmation")).toBe("confirm_cod_order");
    expect(adminTaskOnCreate("pending_payment")).toBeNull();
  });

  it("commits stock on payment or COD confirmation and releases on early cancellation", () => {
    expect(stockEffectFor("pending_payment", "confirmed")).toBe("commit_reservation");
    expect(stockEffectFor("awaiting_cod_confirmation", "confirmed")).toBe("commit_reservation");
    expect(stockEffectFor("pending_payment", "cancelled")).toBe("release_reservation");
    expect(stockEffectFor("awaiting_cod_confirmation", "cancelled")).toBe("release_reservation");
  });

  it("restocks only after QC once a parcel has left", () => {
    expect(stockEffectFor("confirmed", "cancelled")).toBe("restock");
    expect(stockEffectFor("packed", "cancelled")).toBe("restock");
    expect(stockEffectFor("delivery_failed", "rto")).toBe("await_qc");
    expect(stockEffectFor("return_requested", "returned")).toBe("await_qc");
    const restocking = ORDER_TRANSITIONS.filter((t) => t.stockEffect === "restock");
    expect(restocking.every((t) => ["confirmed", "packed"].includes(t.from))).toBe(true);
    expect(stockEffectFor("shipped", "delivered")).toBeNull();
    expect(stockEffectFor("delivered", "cancelled")).toBeNull();
  });

  it("requires a reason for cancellations after confirmation and rejected returns", () => {
    expect(getTransition("confirmed", "cancelled")?.requiresReason).toBe(true);
    expect(getTransition("packed", "cancelled")?.requiresReason).toBe(true);
    expect(getTransition("return_requested", "delivered")?.requiresReason).toBe(true);
    expect(getTransition("packed", "shipped")?.requiresReason).toBe(false);
  });
});

describe("labels", () => {
  it("has customer and admin labels for every status", () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_STATUS_LABELS[status].customer).toBeTruthy();
      expect(ORDER_STATUS_LABELS[status].admin).toBeTruthy();
    }
  });
});
