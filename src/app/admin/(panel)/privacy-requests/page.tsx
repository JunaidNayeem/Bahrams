import { Suspense } from "react";

import { formatDateTime, PageHeader, Pill, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Privacy requests" };

const TYPE: Record<string, string> = {
  access: "Access my data",
  correction: "Correct my data",
  deletion: "Delete my account",
  withdraw_consent: "Withdraw consent",
  grievance: "Privacy grievance",
};

async function Requests() {
  await requireStaff("owner", "manager", "support");
  const supabase = await createClient();
  const { data } = await supabase
    .from("data_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className={tableCls.table}>
        <thead className={tableCls.thead}>
          <tr>
            <th className={tableCls.th}>Request</th>
            <th className={tableCls.th}>From</th>
            <th className={tableCls.th}>Details</th>
            <th className={tableCls.th}>Status</th>
            <th className={tableCls.th}>Due</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((r) => (
            <tr key={r.id} className={tableCls.tr}>
              <td className={`${tableCls.td} font-medium`}>{TYPE[r.type] ?? r.type}</td>
              <td className={tableCls.td}>{r.email}</td>
              <td className={`${tableCls.td} max-w-96 text-muted-foreground`}>{r.details}</td>
              <td className={tableCls.td}>
                <Pill tone={r.status === "completed" ? "success" : "warning"}>{r.status}</Pill>
              </td>
              <td className={`${tableCls.td} whitespace-nowrap text-muted-foreground`}>
                {formatDateTime(r.due_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyRequestsPage() {
  return (
    <>
      <PageHeader
        title="Privacy requests"
        description="DPDP Act: customers can ask to see, correct or delete their data, and withdraw consent as easily as they gave it."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Requests />
      </Suspense>
    </>
  );
}
