import Link from "next/link";
import { Suspense } from "react";

import { formatDate, PageHeader, Pill, tableCls } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { formatINR } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Customers" };

const COUNTED = new Set([
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivery_failed",
  "delivered",
  "return_requested",
  "returned",
]);

async function Customers({
  searchParams,
}: {
  searchParams: PageProps<"/admin/customers">["searchParams"];
}) {
  await requireStaff("owner", "manager", "support", "accountant");
  const raw = (await searchParams).q;
  const q = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, full_name, email, phone, tags, created_at, business_name, orders ( status, total_paise, placed_at, created_at )",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data
    .map((c) => {
      const sales = c.orders.filter((o) => COUNTED.has(o.status));
      const last =
        c.orders
          .map((o) => o.placed_at ?? o.created_at)
          .sort()
          .at(-1) ?? null;
      return { c, orders: sales.length, spent: sales.reduce((n, o) => n + o.total_paise, 0), last };
    })
    .filter(
      ({ c }) =>
        !q || [c.full_name, c.email, c.phone].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
    .sort((a, b) => b.spent - a.spent);

  return (
    <>
      <form className="mb-4 flex gap-2" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Name, email or phone"
          className="max-w-sm"
          aria-label="Search customers"
        />
        <span className="ml-auto self-center text-sm text-muted-foreground">
          {rows.length} customers
        </span>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className={tableCls.table}>
          <thead className={tableCls.thead}>
            <tr>
              <th className={tableCls.th}>Customer</th>
              <th className={tableCls.th}>Contact</th>
              <th className={`${tableCls.th} text-right`}>Orders</th>
              <th className={`${tableCls.th} text-right`}>Lifetime value</th>
              <th className={tableCls.th}>Last order</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, orders, spent, last }) => (
              <tr key={c.id} className={tableCls.tr}>
                <td className={tableCls.td}>
                  <Link href={adminUrls.customer(c.id)} className="font-medium hover:underline">
                    {c.full_name ?? c.email ?? "Unnamed"}
                  </Link>
                  <span className="ml-2 inline-flex gap-1">
                    {c.tags.map((t) => (
                      <Pill key={t} tone={t === "vip" ? "warning" : "neutral"}>
                        {t}
                      </Pill>
                    ))}
                  </span>
                  {c.business_name && (
                    <p className="text-xs text-muted-foreground">{c.business_name}</p>
                  )}
                </td>
                <td className={`${tableCls.td} text-muted-foreground`}>
                  {c.email}
                  <br />
                  {c.phone}
                </td>
                <td className={`${tableCls.td} text-right tabular-nums`}>{orders}</td>
                <td className={`${tableCls.td} text-right tabular-nums`}>
                  {formatINR(spent, { omitZeroPaise: true })}
                </td>
                <td className={`${tableCls.td} text-muted-foreground`}>{formatDate(last)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  return (
    <>
      <PageHeader
        title="Customers"
        description="Shoppers, boutiques and repeat buyers, ranked by lifetime value."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Customers searchParams={searchParams} />
      </Suspense>
    </>
  );
}
