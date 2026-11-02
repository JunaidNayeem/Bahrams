import Link from "next/link";
import { Suspense } from "react";

import {
  formatDateTime,
  ORDER_STATUS_LABELS,
  OrderStatusPill,
  PageHeader,
  PaymentStatusPill,
  tableCls,
} from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls, withQuery } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/domain/enums";
import { formatINR } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

/** The tabs fulfilment works through, in the order an order moves. */
const TABS: (OrderStatus | "all")[] = [
  "all",
  "awaiting_cod_confirmation",
  "pending_payment",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivery_failed",
  "delivered",
  "return_requested",
  "rto",
  "cancelled",
];

const METHOD: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Netbanking", wallet: "Wallet", emi: "EMI", cod: "COD" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Orders({ searchParams }: { searchParams: PageProps<"/admin/orders">["searchParams"] }) {
  await requireStaff("owner", "manager", "fulfilment", "support", "accountant");
  const sp = await searchParams;
  const statusParam = one(sp.status);
  const status = (ORDER_STATUSES as readonly string[]).includes(statusParam ?? "") ? (statusParam as OrderStatus) : null;
  const q = one(sp.q)?.trim() ?? "";
  const method = one(sp.method);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_method, payment_status, total_paise, placed_at, created_at, email, phone, source, shipping_address, order_items ( title, quantity, sell_unit )")
    .order("placed_at", { ascending: false, nullsFirst: false })
    .limit(500);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const o of data) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);

  const name = (o: (typeof data)[number]) => (o.shipping_address as { full_name?: string; city?: string } | null) ?? {};
  const needle = q.toLowerCase();
  const rows = data
    .filter((o) => !status || o.status === status)
    .filter((o) => !method || o.payment_method === method)
    .filter(
      (o) =>
        !needle ||
        o.order_number.toLowerCase().includes(needle) ||
        (o.email ?? "").toLowerCase().includes(needle) ||
        (o.phone ?? "").includes(needle) ||
        (name(o).full_name ?? "").toLowerCase().includes(needle),
    );

  return (
    <>
      <nav aria-label="Filter by status" className="-mx-1 mb-4 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = (t === "all" && !status) || t === status;
          const count = t === "all" ? data.length : (counts.get(t) ?? 0);
          return (
            <Link
              key={t}
              href={withQuery(adminUrls.orders, { status: t === "all" ? undefined : t, q: q || undefined, method })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-charcoal-500",
              )}
            >
              {t === "all" ? "All" : ORDER_STATUS_LABELS[t]}
              <span className={cn("text-xs tabular-nums", active ? "opacity-80" : "text-muted-foreground")}>{count}</span>
            </Link>
          );
        })}
      </nav>

      <form className="mb-4 flex flex-wrap gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <Input name="q" defaultValue={q} placeholder="Order number, name, email or phone" className="max-w-sm" aria-label="Search orders" />
        <select name="method" defaultValue={method ?? ""} aria-label="Payment method" className="h-10 rounded-md border border-input bg-card px-3 text-sm">
          <option value="">All payments</option>
          {Object.entries(METHOD).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="h-10 rounded-md border border-input bg-card px-4 text-sm hover:bg-accent">Search</button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className={tableCls.table}>
          <thead className={tableCls.thead}>
            <tr>
              <th className={tableCls.th}>Order</th>
              <th className={tableCls.th}>Customer</th>
              <th className={tableCls.th}>Items</th>
              <th className={tableCls.th}>Status</th>
              <th className={tableCls.th}>Payment</th>
              <th className={`${tableCls.th} text-right`}>Total</th>
              <th className={tableCls.th}>Placed</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  No orders match.
                </td>
              </tr>
            )}
            {rows.map((o) => (
              <tr key={o.id} className={tableCls.tr}>
                <td className={tableCls.td}>
                  <Link href={adminUrls.order(o.id)} className="font-medium underline-offset-4 hover:underline">
                    {o.order_number}
                  </Link>
                  {o.source !== "web" && <p className="text-xs text-muted-foreground capitalize">{o.source} order</p>}
                </td>
                <td className={tableCls.td}>
                  {name(o).full_name ?? o.email}
                  <p className="text-xs text-muted-foreground">{name(o).city}</p>
                </td>
                <td className={`${tableCls.td} max-w-56 truncate`}>
                  {o.order_items.map((i) => i.title).join(", ")}
                </td>
                <td className={tableCls.td}>
                  <OrderStatusPill status={o.status} />
                </td>
                <td className={tableCls.td}>
                  <span className="mr-2 text-xs">{o.payment_method ? METHOD[o.payment_method] : "—"}</span>
                  <PaymentStatusPill status={o.payment_status} />
                </td>
                <td className={`${tableCls.td} text-right tabular-nums`}>{formatINR(o.total_paise, { omitZeroPaise: true })}</td>
                <td className={`${tableCls.td} whitespace-nowrap text-muted-foreground`}>{formatDateTime(o.placed_at ?? o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <PageHeader title="Orders" description="Every order from the website, phone and WhatsApp, moving through its lifecycle." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}
