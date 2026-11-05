import Link from "next/link";
import { Suspense } from "react";

import { StockAdjustDialog } from "@/components/admin/stock-adjust-dialog";
import { formatDateTime, PageHeader, Panel, Pill, tableCls } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Inventory" };

const REASON_TEXT: Record<string, string> = {
  received: "Received",
  sold: "Sold",
  returned_restock: "Restocked after return",
  damaged_write_off: "Written off",
  audit_correction: "Count correction",
  transfer: "Transfer",
  photoshoot: "Photoshoot",
};

const fmt = (n: number, unit: string) =>
  `${Number.isInteger(n) ? n : n.toFixed(1)}${unit === "metre" ? " m" : ""}`;

async function Inventory({
  searchParams,
}: {
  searchParams: PageProps<"/admin/inventory">["searchParams"];
}) {
  await requireStaff("owner", "manager", "catalogue_editor", "fulfilment");
  const q = (await searchParams).q;
  const query = typeof q === "string" ? q.trim().toLowerCase() : "";
  const supabase = await createClient();

  const [{ data: locations }, { data: variants, error }, { data: moves }] = await Promise.all([
    supabase
      .from("stock_locations")
      .select("id, name, sellable")
      .eq("active", true)
      .order("is_default", { ascending: false }),
    supabase
      .from("product_variants")
      .select(
        "id, sku, colour, sell_unit, active, products!inner ( id, title, is_one_of_a_kind, status ), inventory_levels ( location_id, on_hand, reserved, low_stock_threshold )",
      )
      .order("sku"),
    supabase
      .from("stock_adjustments")
      .select(
        "id, delta, reason, note, created_at, product_variants ( sku, sell_unit ), stock_locations ( name )",
      )
      .order("created_at", { ascending: false })
      .limit(15),
  ]);
  if (error) throw error;
  const locs = locations ?? [];

  const rows = (variants ?? [])
    .filter((v) => v.active && v.products.status !== "archived")
    .filter(
      (v) =>
        !query ||
        v.sku.toLowerCase().includes(query) ||
        v.products.title.toLowerCase().includes(query),
    )
    .map((v) => {
      const byLoc = new Map(v.inventory_levels.map((l) => [l.location_id, l]));
      const sellable = v.inventory_levels.filter(
        (l) => locs.find((x) => x.id === l.location_id)?.sellable,
      );
      const available = sellable.reduce((n, l) => n + Number(l.on_hand) - Number(l.reserved), 0);
      const reserved = v.inventory_levels.reduce((n, l) => n + Number(l.reserved), 0);
      const threshold = Math.max(
        0,
        ...v.inventory_levels.map((l) => Number(l.low_stock_threshold ?? 0)),
      );
      return { v, byLoc, available, reserved, low: available <= threshold };
    });

  return (
    <div className="space-y-6">
      <form className="flex gap-2" role="search">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search SKU or product"
          className="max-w-xs"
          aria-label="Search inventory"
        />
      </form>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className={tableCls.table}>
          <thead className={tableCls.thead}>
            <tr>
              <th className={tableCls.th}>Product / SKU</th>
              {locs.map((l) => (
                <th key={l.id} className={`${tableCls.th} text-right`}>
                  {l.name}
                  {!l.sellable && (
                    <span className="block text-[0.65rem] normal-case">not sellable</span>
                  )}
                </th>
              ))}
              <th className={`${tableCls.th} text-right`}>Reserved</th>
              <th className={`${tableCls.th} text-right`}>Available</th>
              <th className={tableCls.th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ v, byLoc, available, reserved, low }) => (
              <tr key={v.id} className={tableCls.tr}>
                <td className={tableCls.td}>
                  <Link
                    href={adminUrls.product(v.products.id)}
                    className="font-medium hover:underline"
                  >
                    {v.products.title}
                  </Link>
                  <p className="font-mono text-xs text-muted-foreground">
                    {v.sku}
                    {v.colour ? ` · ${v.colour}` : ""}
                    {v.products.is_one_of_a_kind ? " · one of a kind" : ""}
                  </p>
                </td>
                {locs.map((l) => {
                  const level = byLoc.get(l.id);
                  return (
                    <td key={l.id} className={`${tableCls.td} text-right tabular-nums`}>
                      {level ? (
                        fmt(Number(level.on_hand), v.sell_unit)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
                <td className={`${tableCls.td} text-right text-muted-foreground tabular-nums`}>
                  {reserved ? fmt(reserved, v.sell_unit) : "—"}
                </td>
                <td className={`${tableCls.td} text-right tabular-nums`}>
                  {low ? (
                    <Pill tone={available <= 0 ? "danger" : "warning"}>
                      {fmt(available, v.sell_unit)}
                    </Pill>
                  ) : (
                    fmt(available, v.sell_unit)
                  )}
                </td>
                <td className={`${tableCls.td} text-right`}>
                  <StockAdjustDialog
                    variantId={v.id}
                    label={`${v.products.title} (${v.sku})`}
                    unit={v.sell_unit}
                    locations={locs.map(({ id, name }) => ({ id, name }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Panel title="Recent stock movements">
        <ul className="divide-y divide-border text-sm">
          {(moves ?? []).map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
              <span
                className={`w-16 font-medium tabular-nums ${Number(m.delta) < 0 ? "text-destructive" : "text-success"}`}
              >
                {Number(m.delta) > 0 ? "+" : ""}
                {fmt(Number(m.delta), m.product_variants?.sell_unit ?? "piece")}
              </span>
              <span className="font-mono text-xs">{m.product_variants?.sku}</span>
              <span>{REASON_TEXT[m.reason] ?? m.reason}</span>
              <span className="text-muted-foreground">{m.stock_locations?.name}</span>
              {m.note && <span className="text-muted-foreground italic">“{m.note}”</span>}
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDateTime(m.created_at)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export default function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock per location. Available = on hand at sellable locations minus pieces held by open checkouts."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Inventory searchParams={searchParams} />
      </Suspense>
    </>
  );
}
