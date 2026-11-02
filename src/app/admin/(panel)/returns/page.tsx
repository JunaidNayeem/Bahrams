import Link from "next/link";
import { Suspense } from "react";

import { formatDateTime, PageHeader, Pill, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Returns & exchanges" };

const RESOLUTION: Record<string, string> = { exchange: "Exchange", store_credit: "Store credit", refund_to_source: "Refund to source" };

async function Returns() {
  await requireStaff("owner", "manager", "fulfilment", "support", "accountant");
  const supabase = await createClient();
  const { data } = await supabase
    .from("returns")
    .select("id, status, resolution, reason, customer_comment, created_at, orders ( id, order_number, shipping_address )")
    .order("created_at", { ascending: false });

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className={tableCls.table}>
        <thead className={tableCls.thead}>
          <tr>
            <th className={tableCls.th}>Order</th>
            <th className={tableCls.th}>Customer</th>
            <th className={tableCls.th}>Reason</th>
            <th className={tableCls.th}>Wants</th>
            <th className={tableCls.th}>Status</th>
            <th className={tableCls.th}>Requested</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                No return requests.
              </td>
            </tr>
          )}
          {(data ?? []).map((r) => (
            <tr key={r.id} className={tableCls.tr}>
              <td className={tableCls.td}>
                {r.orders && (
                  <Link href={adminUrls.order(r.orders.id)} className="font-medium hover:underline">
                    {r.orders.order_number}
                  </Link>
                )}
              </td>
              <td className={tableCls.td}>{(r.orders?.shipping_address as { full_name?: string } | null)?.full_name}</td>
              <td className={tableCls.td}>
                {r.reason}
                {r.customer_comment && <p className="max-w-80 text-xs text-muted-foreground">“{r.customer_comment}”</p>}
              </td>
              <td className={tableCls.td}>{r.resolution ? RESOLUTION[r.resolution] : "—"}</td>
              <td className={tableCls.td}>
                <Pill tone={r.status === "requested" ? "warning" : "neutral"}>{r.status.replace(/_/g, " ")}</Pill>
              </td>
              <td className={`${tableCls.td} whitespace-nowrap text-muted-foreground`}>{formatDateTime(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <>
      <PageHeader
        title="Returns & exchanges"
        description="7-day window, exchange or store credit first, refund to source on request. Open the order to receive the parcel and record QC."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Returns />
      </Suspense>
    </>
  );
}
