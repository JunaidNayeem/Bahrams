"use server";

import { z } from "zod";

import { readCartCookie, writeCartCookie } from "@/lib/data/cart";
import { formatQuantity, quantityRuleFor, validateQuantity } from "@/lib/domain/quantity";
import { createPublicClient } from "@/lib/supabase/public";

export type CartActionResult = { ok: true; message: string } | { ok: false; message: string };

const lineSchema = z.object({ variantId: z.uuid(), quantity: z.number().positive() });

/** Validates a requested quantity against the variant's sell unit, limits and live stock. */
async function checkQuantity(variantId: string, quantity: number) {
  const supabase = createPublicClient();
  const [{ data: v }, { data: stock }] = await Promise.all([
    supabase
      .from("product_variants")
      .select("sell_unit, min_qty, max_qty, active, products!inner ( title, is_one_of_a_kind )")
      .eq("id", variantId)
      .maybeSingle(),
    supabase.rpc("variant_availability", { p_variant_ids: [variantId] }),
  ]);
  if (!v || !v.active) return { ok: false as const, message: "This item is no longer available." };

  const available = Number(stock?.[0]?.available ?? 0);
  const unit = v.sell_unit;
  const min = Number(v.min_qty);
  if (available < min) {
    return {
      ok: false as const,
      message: v.products.is_one_of_a_kind
        ? "This one-of-a-kind piece has just been reserved or sold."
        : "This item is out of stock.",
    };
  }
  const rule = quantityRuleFor(unit, {
    min,
    max: Math.min(
      v.max_qty === null ? Infinity : Number(v.max_qty),
      unit === "metre" ? Math.floor(available * 2) / 2 : Math.floor(available),
    ),
  });
  const result = validateQuantity(quantity, rule);
  if (!result.valid) return { ok: false as const, message: result.message };
  return { ok: true as const, quantity: result.quantity, title: v.products.title, unit };
}

export async function addToCart(input: {
  variantId: string;
  quantity: number;
}): Promise<CartActionResult> {
  const parsed = lineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a valid quantity." };

  const lines = await readCartCookie();
  const existing = lines.find((l) => l.v === parsed.data.variantId);
  const wanted = (existing?.q ?? 0) + parsed.data.quantity;
  const check = await checkQuantity(parsed.data.variantId, wanted);
  if (!check.ok) return check;

  const next = existing
    ? lines.map((l) => (l.v === parsed.data.variantId ? { ...l, q: check.quantity } : l))
    : [...lines, { v: parsed.data.variantId, q: check.quantity }];
  await writeCartCookie(next);
  return {
    ok: true,
    message: `${check.title} (${formatQuantity(check.quantity, check.unit)}) is in your bag.`,
  };
}

export async function updateCartLine(input: {
  variantId: string;
  quantity: number;
}): Promise<CartActionResult> {
  const parsed = lineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a valid quantity." };

  const check = await checkQuantity(parsed.data.variantId, parsed.data.quantity);
  if (!check.ok) return check;
  const lines = await readCartCookie();
  await writeCartCookie(
    lines.map((l) => (l.v === parsed.data.variantId ? { ...l, q: check.quantity } : l)),
  );
  return { ok: true, message: "Bag updated." };
}

export async function removeCartLine(variantId: string): Promise<CartActionResult> {
  const lines = await readCartCookie();
  await writeCartCookie(lines.filter((l) => l.v !== variantId));
  return { ok: true, message: "Removed from your bag." };
}
