import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ProductGrid } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { searchProducts } from "@/lib/data/catalog";
import { noindexMetadata } from "@/lib/seo/metadata";

// Internal search results are thin, duplicate content: never indexed (robots.txt also blocks /search?).
export const metadata = noindexMetadata("Search", routes.search);

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) ?? "";
  if (!q) return null;
  const products = await searchProducts(q);
  return products.length === 0 ? (
    <EmptyState
      icon={SearchIcon}
      title={`Nothing found for “${q}”`}
      description="Try a fabric name like tussar, matka or ghicha, or ask us on WhatsApp."
      action={
        <Link href={routes.sarees} className="underline">
          Browse all sarees
        </Link>
      }
    />
  ) : (
    <>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {products.length} {products.length === 1 ? "result" : "results"} for “{q}”
      </p>
      <ProductGrid products={products} priorityCount={4} />
    </>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="container-page space-y-8 py-12">
      <h1 className="font-display text-display-lg">Search</h1>
      <form action={routes.search} role="search" className="flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">
          Search sarees and fabric
        </label>
        <Input
          id="q"
          name="q"
          type="search"
          placeholder="Tussar, matka, zari border…"
          autoComplete="off"
        />
        <Button type="submit">Search</Button>
      </form>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
