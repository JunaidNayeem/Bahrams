import { Suspense } from "react";

import { formatDateTime, PageHeader, Pill, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Audit log" };

/** Fields whose change is worth a one-line summary; the full before/after stays in the row. */
const INTERESTING = ["status", "price_paise", "title", "active", "label_number", "on_hand", "role", "value", "rating"];

function summarise(before: unknown, after: unknown): string {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  const changed = INTERESTING.filter((k) => k in a && JSON.stringify(a[k]) !== JSON.stringify(b[k]));
  return changed
    .map((k) => {
      const fmt = (v: unknown) => (k === "price_paise" && typeof v === "number" ? `₹${(v / 100).toLocaleString("en-IN")}` : typeof v === "object" ? "…" : String(v));
      return k in b ? `${k.replace(/_paise$/, "")}: ${fmt(b[k])} → ${fmt(a[k])}` : `${k}: ${fmt(a[k])}`;
    })
    .join(" · ");
}

async function AuditLog() {
  await requireStaff("owner", "manager");
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id, actor_id, actor_role, action, entity_type, entity_id, before, after, created_at")
    .order("created_at", { ascending: false })
    .limit(150);
  const { data: staff } = await supabase.from("staff_members").select("user_id, display_name");
  const names = new Map((staff ?? []).map((s) => [s.user_id, s.display_name]));

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className={tableCls.table}>
        <thead className={tableCls.thead}>
          <tr>
            <th className={tableCls.th}>When</th>
            <th className={tableCls.th}>Who</th>
            <th className={tableCls.th}>What</th>
            <th className={tableCls.th}>Change</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((e) => (
            <tr key={e.id} className={tableCls.tr}>
              <td className={`${tableCls.td} whitespace-nowrap text-muted-foreground`}>{formatDateTime(e.created_at)}</td>
              <td className={tableCls.td}>{e.actor_id ? (names.get(e.actor_id) ?? e.actor_role ?? "Staff") : <span className="text-muted-foreground">System</span>}</td>
              <td className={tableCls.td}>
                <Pill tone={e.action === "delete" ? "danger" : e.action === "insert" ? "success" : "neutral"}>{e.action}</Pill>{" "}
                {e.entity_type.replace(/_/g, " ")}
              </td>
              <td className={`${tableCls.td} text-xs`}>{summarise(e.before, e.after) || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditLogPage() {
  return (
    <>
      <PageHeader title="Audit log" description="Every change to products, prices, labels, orders, stock and settings — who, when and what. It cannot be edited." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AuditLog />
      </Suspense>
    </>
  );
}
