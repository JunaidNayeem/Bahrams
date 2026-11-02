import { AlertTriangleIcon, IndianRupeeIcon, PackageIcon, PhoneCallIcon, ShoppingBagIcon, TruckIcon, Undo2Icon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { RevenueChart } from "@/components/admin/revenue-chart";
import {
  formatDateTime,
  OrderStatusPill,
  PageHeader,
  Panel,
  StatCard,
  tableCls,
} from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { getDashboard } from "@/lib/data/admin/dashboard";
import { formatINR } from "@/lib/domain/money";

export const metadata = { title: "Dashboard" };

const inr = (paise: number) => formatINR(paise, { omitZeroPaise: true });
const METHOD_LABEL: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  emi: "EMI",
  cod: "Cash on delivery",
};

async function Dashboard() {
  const staff = await requireStaff();
  const d = await getDashboard();

  return (
    <>
      <PageHeader
        title={`Good day, ${staff.displayName.split(" ")[0]}`}
        description="Today at Bahram Silks, and the last 30 days."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's orders" value={d.today.orders} hint={inr(d.today.revenuePaise)} icon={ShoppingBagIcon} />
        <StatCard
          label="Revenue, 30 days"
          value={inr(d.last30.revenuePaise)}
          hint={`${d.last30.orders} orders · AOV ${inr(d.last30.averageOrderPaise)}`}
          icon={IndianRupeeIcon}
        />
        <StatCard
          label="Prepaid share"
          value={`${Math.round(d.last30.prepaidShare * 100)}%`}
          hint="Target above 70% to keep COD returns low"
          icon={IndianRupeeIcon}
        />
        <StatCard label="Ready to ship" value={d.toShip} hint="Confirmed or packed" icon={TruckIcon} href={`${adminUrls.orders}?status=confirmed`} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="COD to confirm"
          value={d.toConfirmCod}
          hint="Confirm on WhatsApp before packing"
          icon={PhoneCallIcon}
          tone={d.toConfirmCod ? "warning" : "default"}
          href={`${adminUrls.orders}?status=awaiting_cod_confirmation`}
        />
        <StatCard
          label="Delivery problems"
          value={d.deliveryIssues}
          hint="Failed deliveries awaiting reattempt"
          icon={AlertTriangleIcon}
          tone={d.deliveryIssues ? "warning" : "default"}
          href={`${adminUrls.orders}?status=delivery_failed`}
        />
        <StatCard
          label="Returns waiting"
          value={d.returnsWaiting}
          hint="Requested, approved or received"
          icon={Undo2Icon}
          tone={d.returnsWaiting ? "warning" : "default"}
          href={adminUrls.returns}
        />
        <StatCard
          label="Low stock"
          value={d.lowStock.length}
          hint="At or below the alert level"
          icon={PackageIcon}
          tone={d.lowStock.length ? "warning" : "default"}
          href={adminUrls.inventory}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Revenue per day, last 30 days">
          <RevenueChart data={d.revenueByDay} />
        </Panel>
        <Panel title="How customers paid">
          <ul className="space-y-3 text-sm">
            {d.paymentMix.map((m) => {
              const share = d.last30.orders ? m.orders / d.last30.orders : 0;
              return (
                <li key={m.method}>
                  <div className="flex justify-between">
                    <span>{METHOD_LABEL[m.method] ?? m.method}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {m.orders} · {Math.round(share * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted" aria-hidden>
                    <div className="h-full rounded-full bg-madder-700" style={{ width: `${share * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel
          title="Recent orders"
          action={
            <Link href={adminUrls.orders} className="text-xs underline-offset-4 hover:underline">
              All orders
            </Link>
          }
        >
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className={tableCls.table}>
              <thead className={tableCls.thead}>
                <tr>
                  <th className={tableCls.th}>Order</th>
                  <th className={tableCls.th}>Customer</th>
                  <th className={tableCls.th}>Status</th>
                  <th className={`${tableCls.th} text-right`}>Total</th>
                  <th className={tableCls.th}>Placed</th>
                </tr>
              </thead>
              <tbody>
                {d.recentOrders.map((o) => (
                  <tr key={o.id} className={tableCls.tr}>
                    <td className={tableCls.td}>
                      <Link href={adminUrls.order(o.id)} className="font-medium underline-offset-4 hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className={tableCls.td}>{o.customer}</td>
                    <td className={tableCls.td}>
                      <OrderStatusPill status={o.status} />
                    </td>
                    <td className={`${tableCls.td} text-right tabular-nums`}>{inr(o.totalPaise)}</td>
                    <td className={`${tableCls.td} whitespace-nowrap text-muted-foreground`}>{formatDateTime(o.placedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Top products, 30 days">
            <ol className="space-y-2 text-sm">
              {d.topProducts.map((p, i) => (
                <li key={p.title} className="flex gap-3">
                  <span className="w-4 text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className="flex-1">{p.title}</span>
                  <span className="tabular-nums">{inr(p.revenuePaise)}</span>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel
            title="Low stock"
            action={
              <Link href={adminUrls.inventory} className="text-xs underline-offset-4 hover:underline">
                Inventory
              </Link>
            }
          >
            {d.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Everything is above its alert level.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {d.lowStock.map((s) => (
                  <li key={s.sku} className="flex justify-between gap-3">
                    <Link href={adminUrls.product(s.productId)} className="hover:underline">
                      {s.title}
                    </Link>
                    <span className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {s.available} {s.unit === "metre" ? "m" : "left"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Dashboard />
    </Suspense>
  );
}
