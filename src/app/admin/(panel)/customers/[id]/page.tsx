import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { formatDateTime, OrderStatusPill, PageHeader, Panel, Pill, StatCard, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { CONSENT_PURPOSES } from "@/lib/domain/enums";
import { formatINR } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Customer" };

const PURPOSE_TEXT: Record<string, string> = {
  order_processing: "Order processing",
  marketing_email: "Marketing email",
  marketing_whatsapp: "Marketing WhatsApp",
  marketing_sms: "Marketing SMS",
  analytics: "Analytics",
};

async function Customer({ params }: { params: PageProps<"/admin/customers/[id]">["params"] }) {
  await requireStaff("owner", "manager", "support", "accountant");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("customers")
    .select(
      "*, orders ( id, order_number, status, total_paise, placed_at, created_at, payment_method ), addresses ( * ), consent_events ( purpose, granted, created_at, source ), customer_notes ( id, body, created_at )",
    )
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  const orders = [...c.orders].sort((a, b) => (b.placed_at ?? b.created_at).localeCompare(a.placed_at ?? a.created_at));
  const delivered = orders.filter((o) => !["cancelled", "pending_payment", "rto"].includes(o.status));
  const spent = delivered.reduce((n, o) => n + o.total_paise, 0);
  // DPDP: the current state per purpose is the latest event in an append-only log.
  const consent = new Map<string, { granted: boolean; at: string }>();
  for (const e of [...c.consent_events].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    consent.set(e.purpose, { granted: e.granted, at: e.created_at });
  }

  return (
    <>
      <PageHeader
        title={c.full_name ?? c.email ?? "Customer"}
        back={{ href: adminUrls.customers, label: "Customers" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {c.email} · {c.phone}
            {c.tags.map((t) => (
              <Pill key={t} tone={t === "vip" ? "warning" : "neutral"}>
                {t}
              </Pill>
            ))}
          </span>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders" value={delivered.length} />
        <StatCard label="Lifetime value" value={formatINR(spent, { omitZeroPaise: true })} />
        <StatCard label="Average order" value={delivered.length ? formatINR(Math.round(spent / delivered.length / 100) * 100, { omitZeroPaise: true }) : "—"} />
        <StatCard label="Customer since" value={new Date(c.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel title="Orders">
          <div className="-m-5 overflow-x-auto">
            <table className={tableCls.table}>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={tableCls.tr}>
                    <td className={tableCls.td}>
                      <Link href={adminUrls.order(o.id)} className="font-medium hover:underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className={tableCls.td}>
                      <OrderStatusPill status={o.status} />
                    </td>
                    <td className={`${tableCls.td} text-right tabular-nums`}>{formatINR(o.total_paise, { omitZeroPaise: true })}</td>
                    <td className={`${tableCls.td} text-muted-foreground`}>{formatDateTime(o.placed_at ?? o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Consent (DPDP)">
            <ul className="space-y-2 text-sm">
              {CONSENT_PURPOSES.map((p) => {
                const s = consent.get(p);
                return (
                  <li key={p} className="flex items-center justify-between gap-2">
                    <span>{PURPOSE_TEXT[p]}</span>
                    {s ? <Pill tone={s.granted ? "success" : "neutral"}>{s.granted ? "granted" : "withdrawn"}</Pill> : <Pill>not asked</Pill>}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Marketing is never sent without a granted opt-in. The log is append-only.</p>
          </Panel>
          <Panel title="Addresses">
            {c.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved addresses.</p>
            ) : (
              c.addresses.map((a) => (
                <address key={a.id} className="mb-3 text-sm not-italic">
                  {a.full_name}, {a.line1}, {a.city} {a.pincode}
                </address>
              ))
            )}
          </Panel>
          {c.gstin && (
            <Panel title="Business">
              <p className="text-sm">
                {c.business_name}
                <br />
                GSTIN <span className="font-mono">{c.gstin}</span>
              </p>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

export default function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Customer params={params} />
    </Suspense>
  );
}
