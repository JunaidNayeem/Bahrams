import { ORDER_STATUSES, type OrderStatus, type PaymentMethod } from "../enums";

/**
 * Order lifecycle (kickoff: Admin panel scope → Orders). Every state change sends the customer
 * a message; transitions that need a person to act next also create an admin task. Failed
 * deliveries get a reattempt before RTO, and RTO or returned pieces are restocked only after
 * a quality check, which happens on the return/RTO record, not here.
 */

export type OrderActor = "system" | "staff" | "customer";

/**
 * - commit_reservation: checkout reservation becomes a sale (payment captured / COD confirmed)
 * - release_reservation: reservation dropped, stock never left availability
 * - restock: committed stock goes straight back (cancelled before it left the shop)
 * - await_qc: parcel is coming back; restock only if quality check passes
 */
export type StockEffect = "commit_reservation" | "release_reservation" | "restock" | "await_qc";

export type CustomerMessage =
  | "order_confirmed"
  | "order_cancelled"
  | "order_packed"
  | "order_shipped"
  | "out_for_delivery"
  | "delivery_failed"
  | "delivered"
  | "returned_to_origin"
  | "return_requested"
  | "return_received"
  | "return_rejected";

export type AdminTask =
  | "confirm_cod_order"
  | "pack_order"
  | "book_shipment"
  | "refund_cancelled_order"
  | "resolve_ndr"
  | "qc_rto_parcel"
  | "review_return_request"
  | "issue_refund_or_credit";

export interface OrderTransition {
  from: OrderStatus;
  to: OrderStatus;
  actors: readonly OrderActor[];
  customerMessage: CustomerMessage;
  adminTask: AdminTask | null;
  stockEffect: StockEffect | null;
  /** Staff must record why (cancellations, rejected returns) for the audit log. */
  requiresReason: boolean;
}

const t = (
  from: OrderStatus,
  to: OrderStatus,
  actors: readonly OrderActor[],
  customerMessage: CustomerMessage,
  adminTask: AdminTask | null = null,
  stockEffect: StockEffect | null = null,
  requiresReason = false,
): OrderTransition => ({
  from,
  to,
  actors,
  customerMessage,
  adminTask,
  stockEffect,
  requiresReason,
});

const ALL: readonly OrderActor[] = ["system", "staff", "customer"];
const OPS: readonly OrderActor[] = ["system", "staff"];

export const ORDER_TRANSITIONS: readonly OrderTransition[] = [
  // Prepaid: gateway capture confirms; failure, abandonment or expiry cancels.
  t("pending_payment", "confirmed", OPS, "order_confirmed", "pack_order", "commit_reservation"),
  t("pending_payment", "cancelled", ALL, "order_cancelled", null, "release_reservation"),
  // COD: held until confirmed on WhatsApp or phone; never shipped unconfirmed.
  t(
    "awaiting_cod_confirmation",
    "confirmed",
    OPS,
    "order_confirmed",
    "pack_order",
    "commit_reservation",
  ),
  t("awaiting_cod_confirmation", "cancelled", ALL, "order_cancelled", null, "release_reservation"),
  // Before dispatch the piece has not left the shop, so cancelling restocks without QC.
  t("confirmed", "packed", ["staff"], "order_packed", "book_shipment"),
  t(
    "confirmed",
    "cancelled",
    ["staff", "customer"],
    "order_cancelled",
    "refund_cancelled_order",
    "restock",
    true,
  ),
  t("packed", "shipped", OPS, "order_shipped"),
  t("packed", "cancelled", ["staff"], "order_cancelled", "refund_cancelled_order", "restock", true),
  t("shipped", "out_for_delivery", OPS, "out_for_delivery"),
  t("shipped", "delivery_failed", OPS, "delivery_failed", "resolve_ndr"),
  t("shipped", "delivered", OPS, "delivered"),
  t("out_for_delivery", "delivered", OPS, "delivered"),
  t("out_for_delivery", "delivery_failed", OPS, "delivery_failed", "resolve_ndr"),
  // NDR: reattempt first; RTO only after the customer could not be reached or refused.
  t("delivery_failed", "out_for_delivery", OPS, "out_for_delivery"),
  t("delivery_failed", "rto", OPS, "returned_to_origin", "qc_rto_parcel", "await_qc"),
  t(
    "delivered",
    "return_requested",
    ["staff", "customer"],
    "return_requested",
    "review_return_request",
  ),
  t(
    "return_requested",
    "returned",
    ["staff"],
    "return_received",
    "issue_refund_or_credit",
    "await_qc",
  ),
  // Rejected return requests go back to delivered.
  t("return_requested", "delivered", ["staff"], "return_rejected", null, null, true),
];

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ORDER_STATUSES.filter(
  (status) => !ORDER_TRANSITIONS.some((transition) => transition.from === status),
);

export class InvalidOrderTransitionError extends Error {
  constructor(
    readonly from: OrderStatus,
    readonly to: OrderStatus,
    readonly actor?: OrderActor,
  ) {
    super(
      actor
        ? `${actor} cannot move an order from ${from} to ${to}`
        : `Order cannot move from ${from} to ${to}`,
    );
    this.name = "InvalidOrderTransitionError";
  }
}

export function getTransition(from: OrderStatus, to: OrderStatus): OrderTransition | undefined {
  return ORDER_TRANSITIONS.find((transition) => transition.from === from && transition.to === to);
}

/** Pass `actor` to also check that this kind of actor may make the change. */
export function canTransition(from: OrderStatus, to: OrderStatus, actor?: OrderActor): boolean {
  const transition = getTransition(from, to);
  return !!transition && (!actor || transition.actors.includes(actor));
}

export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor?: OrderActor,
): OrderTransition {
  const transition = getTransition(from, to);
  if (!transition || (actor && !transition.actors.includes(actor))) {
    throw new InvalidOrderTransitionError(from, to, actor);
  }
  return transition;
}

export function nextStatuses(from: OrderStatus, actor?: OrderActor): OrderStatus[] {
  return ORDER_TRANSITIONS.filter(
    (transition) => transition.from === from && (!actor || transition.actors.includes(actor)),
  ).map((transition) => transition.to);
}

/** rto, returned and cancelled: no further order transitions (QC and refunds live on their own records). */
export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

export function customerMessageFor(from: OrderStatus, to: OrderStatus): CustomerMessage | null {
  return getTransition(from, to)?.customerMessage ?? null;
}

export function adminTaskFor(from: OrderStatus, to: OrderStatus): AdminTask | null {
  return getTransition(from, to)?.adminTask ?? null;
}

export function stockEffectFor(from: OrderStatus, to: OrderStatus): StockEffect | null {
  return getTransition(from, to)?.stockEffect ?? null;
}

export function initialOrderStatus(method: PaymentMethod): OrderStatus {
  return method === "cod" ? "awaiting_cod_confirmation" : "pending_payment";
}

/** Task created with the order itself (before any transition). */
export function adminTaskOnCreate(status: OrderStatus): AdminTask | null {
  return status === "awaiting_cod_confirmation" ? "confirm_cod_order" : null;
}

export function isCancellableByCustomer(status: OrderStatus): boolean {
  return canTransition(status, "cancelled", "customer");
}

export const ORDER_STATUS_LABELS: Readonly<
  Record<OrderStatus, { customer: string; admin: string }>
> = {
  pending_payment: { customer: "Awaiting payment", admin: "Pending payment" },
  awaiting_cod_confirmation: { customer: "Awaiting your confirmation", admin: "COD: to confirm" },
  confirmed: { customer: "Confirmed", admin: "Confirmed" },
  packed: { customer: "Packed", admin: "Packed" },
  shipped: { customer: "Shipped", admin: "Shipped" },
  out_for_delivery: { customer: "Out for delivery", admin: "Out for delivery" },
  delivery_failed: { customer: "Delivery attempt missed", admin: "Delivery failed (NDR)" },
  delivered: { customer: "Delivered", admin: "Delivered" },
  rto: { customer: "Returned to us", admin: "RTO" },
  return_requested: { customer: "Return requested", admin: "Return requested" },
  returned: { customer: "Returned", admin: "Returned" },
  cancelled: { customer: "Cancelled", admin: "Cancelled" },
};
