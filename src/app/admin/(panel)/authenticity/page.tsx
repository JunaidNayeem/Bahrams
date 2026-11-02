import Link from "next/link";
import { Suspense } from "react";

import { formatDateTime, PageHeader, Panel, Pill, StatCard, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Authenticity" };

const TYPE: Record<string, string> = { silk_mark: "Silk Mark", handloom_mark: "Handloom Mark" };
const STATUS_TONE = { attached: "success", sold: "info", in_stock: "neutral", void: "danger" } as const;

async function Authenticity() {
  await requireStaff("owner", "manager", "catalogue_editor");
  const supabase = await createClient();
  const [{ data: labels }, { data: usage }, { data: weavers }, { data: products }] = await Promise.all([
    supabase.from("authenticity_labels").select("id, label_type, label_number, status, issued_on, updated_at, products ( id, title )").order("updated_at", { ascending: false }),
    supabase.from("label_usage_log").select("id, action, note, created_at, authenticity_labels ( label_number )").order("created_at", { ascending: false }).limit(10),
    supabase.from("weavers").select("id, name, locality, is_sample, years_weaving").order("name"),
    supabase.from("products").select("id, gi_eligible, authenticity_labels ( label_type, status )").eq("status", "published"),
  ]);
  const live = (l: { status: string }) => l.status === "attached" || l.status === "sold";
  const withSilkMark = (products ?? []).filter((p) => p.authenticity_labels.some((l) => l.label_type === "silk_mark" && live(l))).length;
  const withHandloom = (products ?? []).filter((p) => p.authenticity_labels.some((l) => l.label_type === "handloom_mark" && live(l))).length;
  const gi = (products ?? []).filter((p) => p.gi_eligible).length;
  const total = products?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Published products" value={total} />
        <StatCard label="With Silk Mark label" value={`${withSilkMark} / ${total}`} hint="Only these can say “Pure Silk”" />
        <StatCard label="With Handloom Mark" value={`${withHandloom} / ${total}`} hint="Needed to sell as “handloom”" />
        <StatCard label="GI-eligible" value={`${gi} / ${total}`} hint="Sold as Bhagalpur Silk (GI)" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Panel title="Label register">
          <div className="-m-5 overflow-x-auto">
            <table className={tableCls.table}>
              <thead className={tableCls.thead}>
                <tr>
                  <th className={tableCls.th}>Label</th>
                  <th className={tableCls.th}>Number</th>
                  <th className={tableCls.th}>Piece</th>
                  <th className={tableCls.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(labels ?? []).map((l) => (
                  <tr key={l.id} className={tableCls.tr}>
                    <td className={tableCls.td}>{TYPE[l.label_type] ?? l.label_type}</td>
                    <td className={`${tableCls.td} font-mono`}>{l.label_number}</td>
                    <td className={tableCls.td}>
                      {l.products ? (
                        <Link href={adminUrls.product(l.products.id)} className="hover:underline">
                          {l.products.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className={tableCls.td}>
                      <Pill tone={STATUS_TONE[l.status as keyof typeof STATUS_TONE] ?? "neutral"}>{l.status.replace("_", " ")}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Add or change a label number on the product page. Replaced labels are kept as “void” for the audit trail.</p>
        </Panel>
        <div className="space-y-6">
          <Panel title="Weavers">
            <ul className="space-y-2 text-sm">
              {(weavers ?? []).map((w) => (
                <li key={w.id}>
                  <span className="font-medium">{w.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {w.locality}
                    {w.years_weaving ? ` · ${w.years_weaving} yrs` : ""}
                  </span>
                  {w.is_sample && (
                    <span className="ml-1">
                      <Pill>sample</Pill>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Label usage log">
            <ul className="space-y-2 text-sm">
              {(usage ?? []).length === 0 && <li className="text-muted-foreground">No label movements yet.</li>}
              {(usage ?? []).map((u) => (
                <li key={u.id}>
                  <span className="font-mono">{u.authenticity_labels?.label_number}</span> {u.action}
                  <p className="text-xs text-muted-foreground">{formatDateTime(u.created_at)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default function AuthenticityPage() {
  return (
    <>
      <PageHeader title="Authenticity" description="Silk Mark and Handloom Mark labels, GI eligibility and weavers — the proof behind every badge on the store." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Authenticity />
      </Suspense>
    </>
  );
}
