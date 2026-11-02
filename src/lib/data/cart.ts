import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { computeCartTotals, type CartTotals } from "@/lib/domain/cart";
import type { SellUnit } from "@/lib/domain/enums";
import { createPublicClient } from "@/lib/supabase/public";

import { productMediaUrl } from "./media";
import { getStoreSettings, toCartPricingSettings } from "./settings";

const CART_COOKIE = "bs_cart";
const MAX_LINES = 30;

/**
 * The cookie holds only variant ids and quantities. Prices, titles and stock are always re-read
 * from the database, so a tampered cookie can change nothing but what is in the basket.
 */
const cookieSchema = z
  .array(z.object({ v: z.uuid(), q: z.number().positive().max(1000) }))
  .max(MAX_LINES);
export type CartCookieLine = z.infer<typeof cookieSchema>[number];

export async function readCartCookie(): Promise<CartCookieLine[]> {
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = cookieSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function writeCartCookie(lines: CartCookieLine[]) {
  (await cookies()).set(CART_COOKIE, JSON.stringify(lines.slice(0, MAX_LINES)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export interface CartLine {
  variantId: string;
  sku: string;
  productSlug: string;
  productTitle: string;
  variantTitle: string | null;
  colour: string | null;
  sellUnit: SellUnit;
  unitPricePaise: number;
  quantity: number;
  minQty: number;
  stepQty: number;
  maxQty: number | null;
  available: number;
  isOneOfAKind: boolean;
  hsn: string;
  image: { url: string; alt: string } | null;
}

export interface Cart {
  lines: CartLine[];
  totals: CartTotals;
  /** Lines dropped because the product was unpublished or the variant deactivated. */
  removedCount: number;
}

export async function getCart(): Promise<Cart> {
  const cookieLines = await readCartCookie();
  const settings = await getStoreSettings();
  const supabase = createPublicClient();

  let lines: CartLine[] = [];
  if (cookieLines.length) {
    const ids = cookieLines.map((l) => l.v);
    const [{ data, error }, { data: stock, error: stockError }] = await Promise.all([
      supabase
        .from("product_variants")
        .select(
          "id, sku, title, colour, sell_unit, price_paise, min_qty, step_qty, max_qty, active, products!inner ( slug, title, hsn_code, is_one_of_a_kind, product_media ( storage_path, alt, sort, kind ) )",
        )
        .in("id", ids),
      supabase.rpc("variant_availability", { p_variant_ids: ids }),
    ]);
    if (error) throw error;
    if (stockError) throw stockError;
    const availability = new Map((stock ?? []).map((s) => [s.variant_id, Number(s.available)]));
    const byId = new Map(data.filter((v) => v.active).map((v) => [v.id, v]));

    lines = cookieLines.flatMap((c) => {
      const v = byId.get(c.v);
      if (!v) return [];
      const image = v.products.product_media
        .filter((m) => m.kind === "image")
        .sort((a, b) => a.sort - b.sort)[0];
      return [
        {
          variantId: v.id,
          sku: v.sku,
          productSlug: v.products.slug,
          productTitle: v.products.title,
          variantTitle: v.title,
          colour: v.colour,
          sellUnit: v.sell_unit,
          unitPricePaise: v.price_paise,
          quantity: c.q,
          minQty: Number(v.min_qty),
          stepQty: Number(v.step_qty),
          maxQty: v.max_qty === null ? null : Number(v.max_qty),
          available: availability.get(v.id) ?? 0,
          isOneOfAKind: v.products.is_one_of_a_kind,
          hsn: v.products.hsn_code,
          image: image ? { url: productMediaUrl(image.storage_path), alt: image.alt } : null,
        },
      ];
    });
  }

  const totals = computeCartTotals({
    lines: lines.map((l) => ({
      id: l.variantId,
      unitPricePaise: l.unitPricePaise,
      quantity: l.quantity,
      hsn: l.hsn,
    })),
    paymentMethod: null,
    settings: toCartPricingSettings(settings),
    now: new Date(),
  });

  return { lines, totals, removedCount: cookieLines.length - lines.length };
}

export async function getCartCount(): Promise<number> {
  return (await readCartCookie()).length;
}
