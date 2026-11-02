import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader, PublishStatusPill, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/auth";
import { fibreLabel } from "@/lib/domain/claims";
import type { Fibre } from "@/lib/domain/enums";
import { formatINR } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Collections" };

const SECTION: Record<string, string> = { root: "Department", sarees: "Sarees", fabric: "Fabric", occasion: "Occasion", shop: "Price band" };

/** Plain-English summary of a collection's automatic rules. */
function describeRules(rules: Record<string, unknown>): string {
  const parts: string[] = [];
  const list = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
  if (list(rules.kinds).length) parts.push(list(rules.kinds).map((k) => k.replace(/_/g, " ")).join(", "));
  if (list(rules.fibres).length) parts.push(list(rules.fibres).map((f) => fibreLabel(f as Fibre)).join(", "));
  if (list(rules.occasions).length) parts.push(`for ${list(rules.occasions).join(", ")}`);
  if (rules.has_zari) parts.push("with zari");
  if (rules.gi_eligible) parts.push("GI-eligible only");
  if (rules.swatch_available) parts.push("swatch available");
  if (typeof rules.new_within_days === "number") parts.push(`published in the last ${rules.new_within_days} days`);
  if (typeof rules.price_min_paise === "number") parts.push(`from ${formatINR(rules.price_min_paise, { omitZeroPaise: true })}`);
  if (typeof rules.price_max_paise === "number") parts.push(`under ${formatINR(rules.price_max_paise, { omitZeroPaise: true })}`);
  if (list(rules.exclude_kinds).length) parts.push(`excluding ${list(rules.exclude_kinds).join(", ")}`);
  return parts.join(" · ") || "All products";
}

async function Collections() {
  await requireStaff("owner", "manager", "catalogue_editor");
  const supabase = await createClient();
  const { data } = await supabase.from("collections").select("*").order("section").order("position");
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className={tableCls.table}>
        <thead className={tableCls.thead}>
          <tr>
            <th className={tableCls.th}>Collection</th>
            <th className={tableCls.th}>Type</th>
            <th className={tableCls.th}>Includes</th>
            <th className={tableCls.th}>FAQs</th>
            <th className={tableCls.th}>Status</th>
            <th className={tableCls.th}>
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((c) => (
            <tr key={c.id} className={tableCls.tr}>
              <td className={tableCls.td}>
                <p className="font-medium">{c.title}</p>
                <p className="font-mono text-xs text-muted-foreground">{c.path}</p>
              </td>
              <td className={tableCls.td}>{SECTION[c.section] ?? c.section}</td>
              <td className={`${tableCls.td} text-muted-foreground`}>
                {c.membership === "manual" ? "Hand-picked products" : describeRules(c.rules as Record<string, unknown>)}
              </td>
              <td className={`${tableCls.td} tabular-nums`}>{Array.isArray(c.faqs) ? c.faqs.length : 0}</td>
              <td className={tableCls.td}>
                <PublishStatusPill status={c.status} />
              </td>
              <td className={tableCls.td}>
                {c.path && (
                  <Link href={c.path} target="_blank" aria-label={`View ${c.title}`} className="text-muted-foreground hover:text-foreground">
                    <ExternalLinkIcon className="size-4" />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <>
      <PageHeader
        title="Collections"
        description="Landing pages that fill themselves from product data (fabric, occasion, price). New products appear automatically."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Collections />
      </Suspense>
    </>
  );
}
