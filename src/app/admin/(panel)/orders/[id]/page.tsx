import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OrderActions, OrderNoteForm } from "@/components/admin/order-actions";
import {
  formatDateTime,
  ORDER_STATUS_LABELS,
  OrderStatusPill,
  PageHeader,
  Panel,
  PaymentStatusPill,
  Pill,
} from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { formatINR } from "@/lib/domain/money";
import { nextStatuses, getTransition } from "@/lib/domain/orders";
import { formatQuantity } from "@/lib/domain/quantity";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Order" };

const inr = (p: number) => formatINR(p, { omitZeroPaise: true });
const METHOD: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Netbanking", wallet: "Wallet", emi: "EMI", cod: "Cash on delivery" };

interface Address {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

async function Order({ params }: { params: PageProps<"/admin/orders/[id]">["params"] }) {
  const staff = await requireStaff("owner", "manager", "fulfilment", "support", "accountant");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: o } = await supabase
    .from("orders")
    .select(
      `*, customers ( id, full_name, email, phone, tags ),
       order_items ( * ), payments ( * ), shipments ( * ),
       order_status_history ( id, from_status, to_status, created_at, note ),
       order_notes ( id, body, customer_visible, created_at )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!o) notFound();

  const addr = (o.shipping_address ?? {}) as Address;
  const canAct = staff.role !== "accountant";
  const steps = canAct
    ? nextStatuses(o.status, "staff").map((to) => ({ to, requiresReason: getTransition(o.status, to)?.requiresReason ?? false }))
    : [];
  const phone = (addr.phone ?? o.phone ?? "").replace(/[^\d]/g, "");
  const whatsapp = phone
    ? `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent(
        `Namaste ${addr.full_name ?? ""}, this is Bahram Silks. Please reply YES to confirm your cash-on-delivery order ${o.order_number} for ${inr(o.total_paise)}. Prefer to pay online and save? We can send a UPI link.`,
      )}`
    : null;

  const timeline = [
    ...o.order_status_history.map((h) => ({ at: h.created_at, text: h.from_status ? `${ORDER_STATUS_LABELS[h.from_status]} → ${ORDER_STATUS_LABELS[h.to_status]}` : `Created as ${ORDER_STATUS_LABELS[h.to_status]}`, kind: "status" as const })),
    ...o.order_notes.map((n) => ({ at: n.created_at, text: n.body, kind: (n.customer_visible ? "public" : "note") as "public" | "note" })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const money: [string, number, boolean?][] = [
    ["Subtotal", o.subtotal_paise],
    ["Discount", -o.discount_paise],
    ["Shipping", o.shipping_paise],
    ["COD fee", o.cod_fee_paise],
    ["Gift wrap", o.gift_wrap_paise],
    ["Total", o.total_paise, true],
  ];

  return (
    <>
      <PageHeader
        title={`Order ${o.order_number}`}
        back={{ href: adminUrls.orders, label: "Orders" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <OrderStatusPill status={o.status} />
            <PaymentStatusPill status={o.payment_status} />
            <span>
              Placed {formatDateTime(o.placed_at ?? o.created_at)} · {o.source} · {o.payment_method ? METHOD[o.payment_method] : "—"}
            </span>
          </span>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-border">
              {o.order_items.map((it) => (
                <li key={it.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium">{it.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[it.colour, it.sku, formatQuantity(Number(it.quantity), it.sell_unit), `HSN ${it.hsn_code} @ ${it.gst_rate_bps / 100}%`].filter(Boolean).join(" · ")}
                    </p>
                    {it.silk_mark_label_number && <p className="mt-1 text-xs">Silk Mark {it.silk_mark_label_number}</p>}
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <p>{inr(it.line_total_paise)}</p>
                    <p className="text-xs text-muted-foreground">incl. GST {inr(it.tax_paise)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              {money
                .filter(([, v, total]) => total || v !== 0)
                .map(([k, v, total]) => (
                  <div key={k} className={`flex justify-between ${total ? "pt-1 text-base font-semibold" : ""}`}>
                    <dt>{k}</dt>
                    <dd className="tabular-nums">{v < 0 ? `−${inr(-v)}` : inr(v)}</dd>
                  </div>
                ))}
              <div className="flex justify-between text-xs text-muted-foreground">
                <dt>GST included (place of supply {o.place_of_supply_state_code ?? "—"})</dt>
                <dd className="tabular-nums">{inr(o.tax_paise)}</dd>
              </div>
            </dl>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Payment">
              {o.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {o.payment_method === "cod" ? `Cash on delivery: collect ${inr(o.total_paise)}.` : "No payment captured yet."}
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {o.payments.map((p) => (
                    <li key={p.id}>
                      <div className="flex justify-between">
                        <span>{p.method ? METHOD[p.method] : "Payment"}</span>
                        <span className="tabular-nums">{inr(p.amount_paise)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <PaymentStatusPill status={p.status} /> <span className="font-mono">{p.razorpay_payment_id}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Shipment">
              {o.shipments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not shipped yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {o.shipments.map((s) => (
                    <li key={s.id}>
                      <p>
                        {s.courier} {s.service ? `(${s.service})` : ""} · <span className="font-mono">{s.awb}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Pill>{s.status.replace(/_/g, " ")}</Pill> shipped {formatDateTime(s.shipped_at)}
                        {s.ndr_count > 0 && ` · ${s.ndr_count} failed attempt (${s.ndr_reason})`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Timeline and notes">
            <OrderNoteForm orderId={o.id} />
            <ol className="mt-4 space-y-3 border-l border-border pl-4 text-sm">
              {timeline.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-gold-500" aria-hidden />
                  <p className={e.kind === "status" ? "font-medium" : ""}>
                    {e.text} {e.kind === "public" && <Pill tone="info">shown to customer</Pill>}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(e.at)}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Next step">
            <OrderActions orderId={o.id} status={o.status} steps={steps} whatsapp={whatsapp} />
            {o.status === "awaiting_cod_confirmation" && (
              <p className="mt-3 text-xs text-muted-foreground">COD orders are never packed until the customer confirms.</p>
            )}
          </Panel>
          <Panel title="Customer">
            <div className="space-y-1 text-sm">
              {o.customers ? (
                <Link href={adminUrls.customer(o.customers.id)} className="font-medium hover:underline">
                  {o.customers.full_name ?? o.email}
                </Link>
              ) : (
                <p className="font-medium">{addr.full_name ?? "Guest"}</p>
              )}
              {o.customers?.tags?.includes("vip") && <Pill tone="warning">VIP</Pill>}
              <p className="text-muted-foreground">{o.email}</p>
              <p className="text-muted-foreground">{o.phone}</p>
              {o.gstin && (
                <p className="pt-2 text-xs">
                  B2B: {o.business_name} · GSTIN <span className="font-mono">{o.gstin}</span>
                </p>
              )}
            </div>
          </Panel>
          <Panel title="Ship to">
            <address className="text-sm not-italic">
              {addr.full_name}
              <br />
              {addr.line1}
              {addr.line2 && (
                <>
                  <br />
                  {addr.line2}
                </>
              )}
              <br />
              {addr.city}, {addr.state} {addr.pincode}
              {addr.phone && (
                <>
                  <br />
                  {addr.phone}
                </>
              )}
            </address>
          </Panel>
          {o.gift_message && (
            <Panel title="Gift message">
              <p className="text-sm italic">“{o.gift_message}”</p>
            </Panel>
          )}
          {o.order_items.some((i) => i.product_id) && (
            <Panel title="In the store">
              <ul className="space-y-1 text-sm">
                {o.order_items.map((i) => (
                  <li key={i.id}>
                    {i.product_id ? (
                      <Link href={adminUrls.product(i.product_id)} className="hover:underline">
                        {i.title}
                      </Link>
                    ) : (
                      i.title
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

export default function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Order params={params} />
    </Suspense>
  );
}

