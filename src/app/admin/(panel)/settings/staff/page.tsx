import { Suspense } from "react";

import { formatDate, PageHeader, Panel, Pill, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminNavigation } from "@/config/navigation";
import { requireStaff } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/domain/enums";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Staff & roles" };

const ROLE: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  catalogue_editor: "Catalogue editor",
  fulfilment: "Fulfilment",
  support: "Support",
  accountant: "Accountant",
};

async function Staff() {
  await requireStaff("owner");
  const supabase = await createClient();
  const { data: staff } = await supabase.from("staff_members").select("*").order("created_at");
  const modules = adminNavigation.flatMap((g) => g.items);

  return (
    <div className="space-y-6">
      <Panel title="Team">
        <div className="-m-5 overflow-x-auto">
          <table className={tableCls.table}>
            <thead className={tableCls.thead}>
              <tr>
                <th className={tableCls.th}>Name</th>
                <th className={tableCls.th}>Email</th>
                <th className={tableCls.th}>Role</th>
                <th className={tableCls.th}>Status</th>
                <th className={tableCls.th}>Since</th>
              </tr>
            </thead>
            <tbody>
              {(staff ?? []).map((s) => (
                <tr key={s.user_id} className={tableCls.tr}>
                  <td className={`${tableCls.td} font-medium`}>{s.display_name}</td>
                  <td className={tableCls.td}>{s.email}</td>
                  <td className={tableCls.td}>{ROLE[s.role]}</td>
                  <td className={tableCls.td}>{s.active ? <Pill tone="success">active</Pill> : <Pill>disabled</Pill>}</td>
                  <td className={`${tableCls.td} text-muted-foreground`}>{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Inviting staff and two-factor sign-in are part of the go-live security sprint.
        </p>
      </Panel>

      <Panel title="What each role can open">
        <div className="-m-5 overflow-x-auto">
          <table className={tableCls.table}>
            <thead className={tableCls.thead}>
              <tr>
                <th className={tableCls.th}>Module</th>
                {STAFF_ROLES.map((r) => (
                  <th key={r} className={`${tableCls.th} text-center`}>
                    {ROLE[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.href} className={tableCls.tr}>
                  <td className={tableCls.td}>{m.label}</td>
                  {STAFF_ROLES.map((r) => (
                    <td key={r} className={`${tableCls.td} text-center`}>
                      {m.roles.includes(r) ? <span aria-label="yes">●</span> : <span className="text-muted-foreground" aria-label="no">·</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">The same rules are enforced again in the database (row-level security), not only in the menu.</p>
      </Panel>
    </div>
  );
}

export default function StaffPage() {
  return (
    <>
      <PageHeader title="Staff & roles" description="Who can do what in the admin." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Staff />
      </Suspense>
    </>
  );
}
