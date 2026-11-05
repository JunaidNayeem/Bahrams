import Link from "next/link";
import { Suspense } from "react";

import { formatDateTime, PageHeader, Pill, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { formatINR } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Shipments" };

const TONE: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  delivered: "success",
  in_transit: "info",
  out_for_delivery: "info",
  ndr: "danger",
  rto_delivered: "warning",
};

async function Shipments() {
  await requireStaff("owner", "manager", "fulfilment", "support", "accountant");
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipments")
    .select(
      "id, courier, service, awb, status, cod_amount_paise, shipped_at, delivered_at, ndr_count, ndr_reason, orders ( id, order_number, shipping_address )",
    )
    .order("shipped_at", { ascending: false, nullsFirst: false });

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className={tableCls.table}>
        <thead className={tableCls.thead}>
          <tr>
            <th className={tableCls.th}>AWB</th>
            <th className={tableCls.th}>Order</th>
            <th className={tableCls.th}>Destination</th>
            <th className={tableCls.th}>Courier</th>
            <th className={tableCls.th}>Status</th>
            <th className={`${tableCls.th} text-right`}>COD to collect</th>
            <th className={tableCls.th}>Shipped</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((s) => {
            const addr = (s.orders?.shipping_address ?? {}) as { city?: string; pincode?: string };
            return (
              <tr key={s.id} className={tableCls.tr}>
                <td className={`${tableCls.td} font-mono`}>{s.awb}</td>
                <td className={tableCls.td}>
                  {s.orders && (
                    <Link
                      href={adminUrls.order(s.orders.id)}
                      className="font-medium hover:underline"
                    >
                      {s.orders.order_number}
                    </Link>
                  )}
                </td>
                <td className={tableCls.td}>
                  {addr.city} {addr.pincode}
                </td>
                <td className={tableCls.td}>
                  {s.courier} <span className="text-muted-foreground">{s.service}</span>
                </td>
                <td className={tableCls.td}>
                  <Pill tone={TONE[s.status] ?? "neutral"}>{s.status.replace(/_/g, " ")}</Pill>
                  {s.ndr_count > 0 && (
                    <p className="mt-1 text-xs text-destructive">NDR: {s.ndr_reason}</p>
                  )}
                </td>
                <td className={`${tableCls.td} text-right tabular-nums`}>
                  {s.cod_amount_paise
                    ? formatINR(s.cod_amount_paise, { omitZeroPaise: true })
                    : "Prepaid"}
                </td>
                <td className={`${tableCls.td} whitespace-nowrap text-muted-foreground`}>
                  {formatDateTime(s.shipped_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ShipmentsPage() {
  return (
    <>
      <PageHeader
        title="Shipments"
        description="Couriers are booked manually for launch; a Shiprocket integration adds labels, pickups and live tracking later."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Shipments />
      </Suspense>
    </>
  );
}
