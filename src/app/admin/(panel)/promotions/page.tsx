import { Suspense } from "react";

import { CouponToggle, NewCouponDialog } from "@/components/admin/coupon-controls";
import { formatDate, PageHeader, Pill, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/auth";
import { requestNow } from "@/lib/data/admin/clock";
import { getStoreSettings } from "@/lib/data/settings";
import { formatINR } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Promotions" };

const inr = (p: number) => formatINR(p, { omitZeroPaise: true });

async function Promotions() {
  await requireStaff("owner", "manager");
  const supabase = await createClient();
  const [{ data: coupons }, settings] = await Promise.all([
    supabase.from("coupons").select("*").order("created_at", { ascending: false }),
    getStoreSettings(),
  ]);
  const now = await requestNow();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-semibold">Prepaid incentive (automatic)</p>
          <p className="mt-1 text-sm text-muted-foreground">{settings.prepaidIncentive.message ?? "None"} — steers buyers from COD to UPI.</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-semibold">Free shipping</p>
          <p className="mt-1 text-sm text-muted-foreground">
            On orders above {settings.freeShippingThresholdPaise ? inr(settings.freeShippingThresholdPaise) : "—"}; change it in Settings.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className={tableCls.table}>
          <thead className={tableCls.thead}>
            <tr>
              <th className={tableCls.th}>Code</th>
              <th className={tableCls.th}>Offer</th>
              <th className={tableCls.th}>Conditions</th>
              <th className={tableCls.th}>Runs</th>
              <th className={`${tableCls.th} text-right`}>Used</th>
              <th className={tableCls.th}>Active</th>
            </tr>
          </thead>
          <tbody>
            {(coupons ?? []).map((c) => {
              const ended = c.ends_at && Date.parse(c.ends_at) < now;
              return (
                <tr key={c.id} className={tableCls.tr}>
                  <td className={tableCls.td}>
                    <span className="font-mono font-medium">{c.code}</span>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  </td>
                  <td className={tableCls.td}>
                    {c.type === "percentage"
                      ? `${(c.percent_bps ?? 0) / 100}% off${c.max_discount_paise ? ` (max ${inr(c.max_discount_paise)})` : ""}`
                      : c.type === "flat"
                        ? `${inr(c.amount_paise ?? 0)} off`
                        : "Free shipping"}
                  </td>
                  <td className={`${tableCls.td} text-muted-foreground`}>
                    {[c.min_order_paise ? `over ${inr(c.min_order_paise)}` : null, c.first_order_only ? "first order" : null, c.usage_limit_per_customer ? `${c.usage_limit_per_customer}× per customer` : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className={`${tableCls.td} whitespace-nowrap`}>
                    {c.starts_at || c.ends_at ? `${formatDate(c.starts_at)} – ${formatDate(c.ends_at)}` : "Always"}
                    {ended && (
                      <span className="ml-2">
                        <Pill>ended</Pill>
                      </span>
                    )}
                  </td>
                  <td className={`${tableCls.td} text-right tabular-nums`}>
                    {c.times_used}
                    {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                  </td>
                  <td className={tableCls.td}>
                    <CouponToggle id={c.id} active={c.active} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  return (
    <>
      <PageHeader
        title="Promotions"
        description="Coupons and automatic offers. Discounts on product pages come only from genuine price history."
        actions={<NewCouponDialog />}
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Promotions />
      </Suspense>
    </>
  );
}
