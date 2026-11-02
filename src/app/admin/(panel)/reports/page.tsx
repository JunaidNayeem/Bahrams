import Link from "next/link";
import { Suspense } from "react";

import { CsvButton } from "@/components/admin/csv-button";
import { PageHeader, Panel, StatCard, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls, withQuery } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { requireStaff } from "@/lib/auth";
import { requestNow } from "@/lib/data/admin/clock";
import { fibreLabel } from "@/lib/domain/claims";
import type { Fibre } from "@/lib/domain/enums";
import { formatINR } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reports" };

const SALE = new Set(["confirmed", "packed", "shipped", "out_for_delivery", "delivery_failed", "delivered", "return_requested", "returned"]);
const PERIODS = [30, 90, 365] as const;
const inr = (p: number) => formatINR(p, { omitZeroPaise: true });

async function Reports({ searchParams }: { searchParams: PageProps<"/admin/reports">["searchParams"] }) {
  await requireStaff("owner", "manager", "accountant");
  const now = await requestNow();
  const daysParam = Number((await searchParams).days);
  const days = (PERIODS as readonly number[]).includes(daysParam) ? daysParam : 30;
  const since = new Date(now - days * 86_400_000).toISOString();

  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, source, payment_method, payment_status, total_paise, cod_fee_paise, shipping_paise, place_of_supply_state_code, placed_at, order_items ( hsn_code, gst_rate_bps, line_total_paise, tax_paise, quantity, sell_unit, products ( primary_fibre ) )")
    .gte("placed_at", since);
  if (error) throw error;

  const sales = orders.filter((o) => SALE.has(o.status));
  const revenue = sales.reduce((n, o) => n + o.total_paise, 0);
  const returned = orders.filter((o) => o.status === "return_requested" || o.status === "returned").length;
  const rto = orders.filter((o) => o.status === "rto").length;
  const cod = orders.filter((o) => o.payment_method === "cod");

  // GST by HSN. Seller is in Bihar (10): same-state supplies split CGST/SGST, others are IGST.
  const hsn = new Map<string, { rate: number; qty: number; gross: number; tax: number; intra: number; inter: number }>();
  const byFibre = new Map<string, number>();
  for (const o of sales) {
    const intra = o.place_of_supply_state_code === siteConfig.sellerState.gstStateCode;
    for (const it of o.order_items) {
      const key = `${it.hsn_code}@${it.gst_rate_bps}`;
      const row = hsn.get(key) ?? { rate: it.gst_rate_bps / 100, qty: 0, gross: 0, tax: 0, intra: 0, inter: 0 };
      row.qty += Number(it.quantity);
      row.gross += it.line_total_paise;
      row.tax += it.tax_paise;
      if (intra) row.intra += it.tax_paise;
      else row.inter += it.tax_paise;
      hsn.set(key, row);
      const fibre = it.products?.primary_fibre ?? "blend";
      byFibre.set(fibre, (byFibre.get(fibre) ?? 0) + it.line_total_paise);
    }
  }
  const hsnRows = [...hsn.entries()].map(([key, r]) => ({ hsn: key.split("@")[0], ...r }));
  const fibreRows = [...byFibre.entries()].sort((a, b) => b[1] - a[1]);
  const fibreMax = Math.max(1, ...fibreRows.map(([, v]) => v));
  const channels = new Map<string, number>();
  for (const o of sales) channels.set(o.source, (channels.get(o.source) ?? 0) + o.total_paise);

  const codDelivered = cod.filter((o) => o.status === "delivered");
  const codCollected = codDelivered.filter((o) => o.payment_status === "captured");
  const codInTransit = cod.filter((o) => ["confirmed", "packed", "shipped", "out_for_delivery", "delivery_failed"].includes(o.status));

  return (
    <div className="space-y-6">
      <nav aria-label="Period" className="flex gap-2">
        {PERIODS.map((d) => (
          <Link
            key={d}
            href={withQuery(adminUrls.reports, { days: d === 30 ? undefined : d })}
            aria-current={d === days ? "page" : undefined}
            className={cn("rounded-full border px-3 py-1.5 text-sm", d === days ? "border-foreground bg-foreground text-background" : "border-border bg-card")}
          >
            Last {d} days
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Net sales" value={inr(revenue)} hint={`${sales.length} orders`} />
        <StatCard label="Average order value" value={sales.length ? inr(Math.round(revenue / sales.length / 100) * 100) : "—"} hint="Target above ₹4,000" />
        <StatCard label="Return / exchange rate" value={`${orders.length ? Math.round((returned / orders.length) * 100) : 0}%`} hint="Target under 8%" />
        <StatCard
          label="COD RTO rate"
          value={`${cod.length ? Math.round((rto / cod.length) * 100) : 0}%`}
          hint="Target under 18%"
          tone={cod.length && rto / cod.length > 0.18 ? "warning" : "default"}
        />
      </div>

      <Panel
        title="GST summary by HSN (place of supply from Bihar)"
        action={
          <CsvButton
            filename={`bahram-hsn-summary-${days}d.csv`}
            rows={[
              ["HSN", "Rate %", "Quantity", "Value incl. GST (INR)", "Taxable value (INR)", "CGST+SGST (INR)", "IGST (INR)"],
              ...hsnRows.map((r) => [r.hsn, r.rate, r.qty, (r.gross / 100).toFixed(2), ((r.gross - r.tax) / 100).toFixed(2), (r.intra / 100).toFixed(2), (r.inter / 100).toFixed(2)]),
            ]}
          />
        }
      >
        <div className="-m-5 overflow-x-auto">
          <table className={tableCls.table}>
            <thead className={tableCls.thead}>
              <tr>
                <th className={tableCls.th}>HSN</th>
                <th className={`${tableCls.th} text-right`}>Rate</th>
                <th className={`${tableCls.th} text-right`}>Qty</th>
                <th className={`${tableCls.th} text-right`}>Taxable value</th>
                <th className={`${tableCls.th} text-right`}>CGST + SGST</th>
                <th className={`${tableCls.th} text-right`}>IGST</th>
                <th className={`${tableCls.th} text-right`}>Total incl. GST</th>
              </tr>
            </thead>
            <tbody>
              {hsnRows.map((r) => (
                <tr key={`${r.hsn}-${r.rate}`} className={tableCls.tr}>
                  <td className={`${tableCls.td} font-mono`}>{r.hsn}</td>
                  <td className={`${tableCls.td} text-right`}>{r.rate}%</td>
                  <td className={`${tableCls.td} text-right tabular-nums`}>{r.qty}</td>
                  <td className={`${tableCls.td} text-right tabular-nums`}>{formatINR(r.gross - r.tax)}</td>
                  <td className={`${tableCls.td} text-right tabular-nums`}>{formatINR(r.intra)}</td>
                  <td className={`${tableCls.td} text-right tabular-nums`}>{formatINR(r.inter)}</td>
                  <td className={`${tableCls.td} text-right tabular-nums`}>{formatINR(r.gross)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Working figures for the CA. GSTR-1 filing stays with the accountant.</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Sales by fabric">
          <ul className="space-y-3 text-sm">
            {fibreRows.map(([fibre, value]) => (
              <li key={fibre}>
                <div className="flex justify-between">
                  <span>{fibreLabel(fibre as Fibre)}</span>
                  <span className="tabular-nums">{inr(value)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted" aria-hidden>
                  <div className="h-full rounded-full bg-madder-700" style={{ width: `${(value / fibreMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="space-y-6">
          <Panel title="Cash on delivery reconciliation">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Delivered COD orders</dt>
                <dd className="tabular-nums">
                  {codDelivered.length} · {inr(codDelivered.reduce((n, o) => n + o.total_paise, 0))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Remitted by courier</dt>
                <dd className="tabular-nums">
                  {codCollected.length} · {inr(codCollected.reduce((n, o) => n + o.total_paise, 0))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Still with courier / in transit</dt>
                <dd className="tabular-nums">
                  {codInTransit.length} · {inr(codInTransit.reduce((n, o) => n + o.total_paise, 0))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Returned to origin</dt>
                <dd className="tabular-nums">{rto}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Sales by channel">
            <ul className="space-y-2 text-sm">
              {[...channels.entries()].map(([source, value]) => (
                <li key={source} className="flex justify-between capitalize">
                  <span>{source === "web" ? "Website" : source}</span>
                  <span className="tabular-nums">{inr(value)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  return (
    <>
      <PageHeader title="Reports" description="Sales, GST workings, COD money and the KPIs from the launch plan." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Reports searchParams={searchParams} />
      </Suspense>
    </>
  );
}
