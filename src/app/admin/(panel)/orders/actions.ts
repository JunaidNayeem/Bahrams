"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { requireStaff } from "@/lib/auth";
import type { TablesUpdate } from "@/lib/db";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { ORDER_STATUSES } from "@/lib/domain/enums";
import { getTransition } from "@/lib/domain/orders";
import { createClient } from "@/lib/supabase/server";

const ORDER_STAFF = ["owner", "manager", "fulfilment", "support"] as const;

const transitionSchema = z.object({
  orderId: z.uuid(),
  to: z.enum(ORDER_STATUSES),
  reason: z.string().trim().max(300).optional(),
  courier: z.string().trim().max(60).optional(),
  awb: z.string().trim().max(60).optional(),
});

export type ActionResult = { ok: boolean; message: string };

export async function transitionOrder(input: z.input<typeof transitionSchema>): Promise<ActionResult> {
  const staff = await requireStaff(...ORDER_STAFF);
  const parsed = transitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const { orderId, to, reason, courier, awb } = parsed.data;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, payment_method, total_paise, shipping_paise, cod_fee_paise")
    .eq("id", orderId)
    .single();
  if (!order) return { ok: false, message: "Order not found." };

  const transition = getTransition(order.status, to);
  if (!transition || !transition.actors.includes("staff")) {
    return { ok: false, message: `An order can't move from ${order.status.replace(/_/g, " ")} to ${to.replace(/_/g, " ")}.` };
  }
  if (transition.requiresReason && !reason) return { ok: false, message: "Please record a reason." };
  if (to === "cancelled" && staff.role === "support" && order.status !== "awaiting_cod_confirmation" && order.status !== "pending_payment") {
    return { ok: false, message: "Only fulfilment or a manager can cancel a confirmed order." };
  }
  if (to === "shipped" && (!courier || !awb)) return { ok: false, message: "Enter the courier and AWB number." };

  // Stock follows the order only when this checkout actually holds reservations (orders created
  // by phone or imported history have none, so there is nothing to commit, release or restock).
  const { data: holds } = await supabase.from("stock_reservations").select("status").eq("checkout_id", orderId);
  const hasActive = (holds ?? []).some((h) => h.status === "active");
  const hasCommitted = (holds ?? []).some((h) => h.status === "committed");

  if (transition.stockEffect === "commit_reservation" && hasActive) {
    const { error } = await supabase.rpc("commit_reservation", { p_checkout_id: orderId });
    if (error) return { ok: false, message: error.message.includes("reservation_lapsed") ? "The reserved stock has been sold elsewhere." : error.message };
  }
  if (transition.stockEffect === "release_reservation" && hasActive) {
    await supabase.rpc("release_reservation", { p_checkout_id: orderId });
  }
  if (transition.stockEffect === "restock" && hasCommitted) {
    const [{ data: items }, { data: location }] = await Promise.all([
      supabase.from("order_items").select("variant_id, quantity").eq("order_id", orderId),
      supabase.from("stock_locations").select("id").eq("is_default", true).single(),
    ]);
    for (const item of items ?? []) {
      if (!item.variant_id || !location) continue;
      await supabase.rpc("apply_stock_adjustment", {
        p_variant_id: item.variant_id,
        p_location_id: location.id,
        p_delta: Number(item.quantity),
        p_reason: "returned_restock",
        p_note: `Order cancelled before dispatch`,
      });
    }
  }

  if (to === "shipped") {
    await supabase.from("shipments").insert({
      order_id: orderId,
      courier: courier!,
      awb: awb!,
      status: "in_transit",
      cod_amount_paise: order.payment_method === "cod" ? order.total_paise : 0,
      shipped_at: new Date().toISOString(),
    });
  }

  const patch: TablesUpdate<"orders"> = { status: to };
  if (order.status === "awaiting_cod_confirmation" && to === "confirmed") {
    patch.cod_confirmed_at = new Date().toISOString();
    patch.cod_confirmed_by = staff.userId;
  }
  if (to === "cancelled") patch.cancel_reason = reason ?? "Cancelled";
  const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
  if (error) return { ok: false, message: error.message };

  if (reason) {
    await supabase.from("order_notes").insert({ order_id: orderId, author_id: staff.userId, body: `${to.replace(/_/g, " ")}: ${reason}` });
  }
  if (transition.stockEffect) updateTag(CATALOG_TAG);
  return { ok: true, message: "Order updated. The customer message has been queued." };
}

export async function addOrderNote(orderId: string, body: string, customerVisible: boolean): Promise<ActionResult> {
  const staff = await requireStaff(...ORDER_STAFF);
  const text = body.trim().slice(0, 1000);
  if (!text) return { ok: false, message: "Write a note first." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("order_notes")
    .insert({ order_id: orderId, author_id: staff.userId, body: text, customer_visible: customerVisible });
  return error ? { ok: false, message: error.message } : { ok: true, message: "Note added." };
}
