import "server-only";

import { connection } from "next/server";

import type { OrderStatus, PaymentMethod } from "@/lib/domain/enums";
import { createClient } from "@/lib/supabase/server";

/** Orders that count as sales (money taken or COD confirmed). */
const SALE_STATUSES: OrderStatus[] = [
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivery_failed",
  "delivered",
  "return_requested",
  "returned",
];

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Midnight IST `daysAgo` days ago, as an ISO instant. */
function istMidnight(daysAgo = 0): Date {
  const now = new Date(Date.now() + IST_OFFSET_MS);
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo);
  return new Date(midnight - IST_OFFSET_MS);
}

function istDayKey(iso: string): string {
  return new Date(Date.parse(iso) + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export interface DashboardData {
  today: { orders: number; revenuePaise: number };
  last30: { orders: number; revenuePaise: number; prepaidShare: number; averageOrderPaise: number };
  toConfirmCod: number;
  toShip: number;
  deliveryIssues: number;
  returnsWaiting: number;
  lowStock: { sku: string; title: string; available: number; unit: string; productId: string }[];
  revenueByDay: { day: string; revenue: number; orders: number }[];
  paymentMix: { method: PaymentMethod; orders: number }[];
  topProducts: { title: string; units: number; revenuePaise: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod | null;
    totalPaise: number;
    placedAt: string;
  }[];
}

export async function getDashboard(): Promise<DashboardData> {
  // "Today" and the 30-day window depend on the clock: always render at request time.
  await connection();
  const supabase = await createClient();
  const since = istMidnight(29);
  const today = istMidnight(0);

  const [orders, items, levels, returns] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, payment_method, total_paise, placed_at, created_at, shipping_address, email")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("order_items")
      .select("title, quantity, line_total_paise, sell_unit, orders!inner ( status, created_at )")
      .gte("orders.created_at", since.toISOString()),
    supabase
      .from("inventory_levels")
      .select("on_hand, reserved, low_stock_threshold, product_variants!inner ( sku, sell_unit, product_id, products!inner ( title ) )"),
    supabase.from("returns").select("id", { count: "exact", head: true }).in("status", ["requested", "approved", "received"]),
  ]);
  for (const r of [orders, items, levels]) if (r.error) throw r.error;

  // Phone and imported orders can be entered after they were placed: report on placed_at.
  const placedAt = (o: { placed_at: string | null; created_at: string }) => o.placed_at ?? o.created_at;
  const all = [...orders.data!].sort((a, b) => placedAt(b).localeCompare(placedAt(a)));
  const sales = all.filter((o) => SALE_STATUSES.includes(o.status));
  const sum = (rows: typeof all) => rows.reduce((n, o) => n + o.total_paise, 0);
  const todaySales = sales.filter((o) => Date.parse(placedAt(o)) >= today.getTime());
  const prepaid = sales.filter((o) => o.payment_method && o.payment_method !== "cod").length;

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let d = 29; d >= 0; d--) byDay.set(istDayKey(istMidnight(d).toISOString()), { revenue: 0, orders: 0 });
  for (const o of sales) {
    const bucket = byDay.get(istDayKey(placedAt(o)));
    if (bucket) {
      bucket.revenue += o.total_paise / 100;
      bucket.orders += 1;
    }
  }

  const mix = new Map<PaymentMethod, number>();
  for (const o of sales) if (o.payment_method) mix.set(o.payment_method, (mix.get(o.payment_method) ?? 0) + 1);

  const top = new Map<string, { units: number; revenuePaise: number }>();
  for (const it of items.data!) {
    if (!SALE_STATUSES.includes(it.orders.status)) continue;
    const t = top.get(it.title) ?? { units: 0, revenuePaise: 0 };
    t.units += it.sell_unit === "metre" ? 1 : Number(it.quantity);
    t.revenuePaise += it.line_total_paise;
    top.set(it.title, t);
  }

  // Aggregate per variant across locations before comparing with the threshold.
  const perVariant = new Map<string, { sku: string; title: string; unit: string; productId: string; available: number; threshold: number }>();
  for (const l of levels.data!) {
    const v = l.product_variants;
    const row = perVariant.get(v.sku) ?? {
      sku: v.sku,
      title: v.products.title,
      unit: v.sell_unit,
      productId: v.product_id,
      available: 0,
      threshold: 0,
    };
    row.available += Number(l.on_hand) - Number(l.reserved);
    row.threshold = Math.max(row.threshold, Number(l.low_stock_threshold ?? (v.sell_unit === "metre" ? 10 : 0)));
    perVariant.set(v.sku, row);
  }

  const customerName = (o: (typeof all)[number]) => {
    const addr = o.shipping_address as { full_name?: string } | null;
    return addr?.full_name ?? o.email ?? "Guest";
  };

  return {
    today: { orders: todaySales.length, revenuePaise: sum(todaySales) },
    last30: {
      orders: sales.length,
      revenuePaise: sum(sales),
      prepaidShare: sales.length ? prepaid / sales.length : 0,
      averageOrderPaise: sales.length ? Math.round(sum(sales) / sales.length / 100) * 100 : 0,
    },
    toConfirmCod: all.filter((o) => o.status === "awaiting_cod_confirmation").length,
    toShip: all.filter((o) => o.status === "confirmed" || o.status === "packed").length,
    deliveryIssues: all.filter((o) => o.status === "delivery_failed").length,
    returnsWaiting: returns.count ?? 0,
    lowStock: [...perVariant.values()]
      .filter((v) => v.available <= v.threshold)
      .sort((a, b) => a.available - b.available)
      .slice(0, 8)
      .map(({ sku, title, available, unit, productId }) => ({ sku, title, available, unit, productId })),
    revenueByDay: [...byDay.entries()].map(([day, v]) => ({ day: day.slice(5), ...v })),
    paymentMix: [...mix.entries()].map(([method, n]) => ({ method, orders: n })).sort((a, b) => b.orders - a.orders),
    topProducts: [...top.entries()]
      .map(([title, v]) => ({ title, ...v }))
      .sort((a, b) => b.revenuePaise - a.revenuePaise)
      .slice(0, 5),
    recentOrders: all.slice(0, 8).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      customer: customerName(o),
      status: o.status,
      paymentMethod: o.payment_method,
      totalPaise: o.total_paise,
      placedAt: placedAt(o),
    })),
  };
}
