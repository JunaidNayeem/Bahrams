import { connection } from "next/server";
import { Suspense } from "react";

import { formatDateTime, PageHeader, Pill, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Grievances" };

function due(iso: string | null, doneAt: string | null) {
  if (doneAt) return <Pill tone="success">met</Pill>;
  if (!iso) return "—";
  const hours = Math.round((Date.parse(iso) - Date.now()) / 3_600_000);
  if (hours < 0) return <Pill tone="danger">overdue {Math.abs(hours)}h</Pill>;
  return <Pill tone={hours < 12 ? "warning" : "neutral"}>{hours < 48 ? `${hours}h left` : `${Math.round(hours / 24)}d left`}</Pill>;
}

async function Grievances() {
  await requireStaff("owner", "manager", "support");
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("grievances").select("*").order("created_at", { ascending: false });

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className={tableCls.table}>
        <thead className={tableCls.thead}>
          <tr>
            <th className={tableCls.th}>Ticket</th>
            <th className={tableCls.th}>From</th>
            <th className={tableCls.th}>Subject</th>
            <th className={tableCls.th}>Status</th>
            <th className={tableCls.th}>Acknowledge (48 h)</th>
            <th className={tableCls.th}>Resolve (1 month)</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((g) => (
            <tr key={g.id} className={tableCls.tr}>
              <td className={`${tableCls.td} font-mono`}>{g.reference}</td>
              <td className={tableCls.td}>
                {g.name}
                <p className="text-xs text-muted-foreground">{g.email}</p>
              </td>
              <td className={tableCls.td}>
                {g.subject}
                <p className="max-w-96 text-xs text-muted-foreground">
                  {g.order_number && `Order ${g.order_number} · `}
                  {formatDateTime(g.created_at)}
                </p>
              </td>
              <td className={tableCls.td}>
                <Pill tone={g.status === "resolved" ? "success" : "warning"}>{g.status.replace(/_/g, " ")}</Pill>
              </td>
              <td className={tableCls.td}>{due(g.ack_due_at, g.acknowledged_at)}</td>
              <td className={tableCls.td}>{due(g.resolve_due_at, g.resolved_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GrievancesPage() {
  return (
    <>
      <PageHeader
        title="Grievances"
        description="Consumer Protection (E-Commerce) Rules: acknowledge every complaint within 48 hours and resolve it within one month."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Grievances />
      </Suspense>
    </>
  );
}
