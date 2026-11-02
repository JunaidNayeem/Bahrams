import { BadgeCheckIcon, ExternalLinkIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader, PublishStatusPill, tableCls } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls, CATALOGUE_SECTIONS, productUrl } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { listAdminProducts } from "@/lib/data/admin/products";
import { fibreLabel } from "@/lib/domain/claims";
import { PRODUCT_KINDS, PUBLISH_STATUSES, type ProductKind, type PublishStatus } from "@/lib/domain/enums";
import { formatINR } from "@/lib/domain/money";

export const metadata = { title: "Products" };

type SP = PageProps<"/admin/products">["searchParams"];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function ProductTable({ searchParams }: { searchParams: SP }) {
  await requireStaff("owner", "manager", "catalogue_editor", "fulfilment");
  const sp = await searchParams;
  const status = one(sp.status);
  const kind = one(sp.kind);
  const q = one(sp.q)?.trim();
  const rows = await listAdminProducts({
    q: q || undefined,
    status: (PUBLISH_STATUSES as readonly string[]).includes(status ?? "") ? (status as PublishStatus) : undefined,
    kind: (PRODUCT_KINDS as readonly string[]).includes(kind ?? "") ? (kind as ProductKind) : undefined,
  });

  return (
    <>
      <form className="mb-4 flex flex-wrap items-center gap-2" role="search">
        <Input name="q" defaultValue={q} placeholder="Search title or slug" className="max-w-xs" aria-label="Search products" />
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className="h-10 rounded-md border border-input bg-card px-3 text-sm">
          <option value="">All statuses</option>
          {PUBLISH_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select name="kind" defaultValue={kind ?? ""} aria-label="Type" className="h-10 rounded-md border border-input bg-card px-3 text-sm">
          <option value="">All types</option>
          {PRODUCT_KINDS.map((k) => (
            <option key={k} value={k}>
              {CATALOGUE_SECTIONS[k].label}
            </option>
          ))}
        </select>
        <button className={buttonVariants({ variant: "outline" })}>Filter</button>
        <span className="ml-auto text-sm text-muted-foreground">{rows.length} products</span>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className={tableCls.table}>
          <thead className={tableCls.thead}>
            <tr>
              <th className={tableCls.th}>Product</th>
              <th className={tableCls.th}>Type</th>
              <th className={tableCls.th}>Price</th>
              <th className={`${tableCls.th} text-right`}>Available</th>
              <th className={tableCls.th}>Status</th>
              <th className={tableCls.th}>
                <span className="sr-only">Store link</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className={tableCls.tr}>
                <td className={tableCls.td}>
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
                      {p.thumbnail && <Image src={p.thumbnail} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <div>
                      <Link href={adminUrls.product(p.id)} className="font-medium underline-offset-4 hover:underline">
                        {p.title}
                      </Link>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {fibreLabel(p.primaryFibre)}
                        {p.isOneOfAKind && " · One of a kind"}
                        {p.hasSilkMark && (
                          <span className="inline-flex items-center gap-0.5 text-gold-text">
                            · <BadgeCheckIcon className="size-3" aria-hidden /> Silk Mark
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={tableCls.td}>{CATALOGUE_SECTIONS[p.kind].label}</td>
                <td className={`${tableCls.td} whitespace-nowrap tabular-nums`}>
                  {p.priceMinPaise === null
                    ? "—"
                    : formatINR(p.priceMinPaise, { omitZeroPaise: true }) +
                      (p.priceMaxPaise && p.priceMaxPaise > p.priceMinPaise ? `–${formatINR(p.priceMaxPaise, { omitZeroPaise: true })}` : "") +
                      (p.sellUnit === "metre" ? " /m" : "")}
                </td>
                <td className={`${tableCls.td} text-right tabular-nums ${p.stock <= 0 ? "text-destructive" : ""}`}>
                  {p.stock}
                  {p.sellUnit === "metre" ? " m" : ""}
                </td>
                <td className={tableCls.td}>
                  <PublishStatusPill status={p.status} />
                </td>
                <td className={tableCls.td}>
                  {p.status === "published" && (
                    <Link href={productUrl(p.slug)} target="_blank" aria-label={`View ${p.title} in store`} className="text-muted-foreground hover:text-foreground">
                      <ExternalLinkIcon className="size-4" />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageHeader
        title="Products"
        description="Sarees, fabric and everything else in the catalogue. Badges on the store come only from the records here."
        actions={
          <Link href={adminUrls.newProduct} className={buttonVariants()}>
            <PlusIcon /> New product
          </Link>
        }
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ProductTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}
