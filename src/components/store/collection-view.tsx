import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ZariDivider } from "@/components/brand/zari-divider";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { routes, withQuery } from "@/config/routes";
import {
  getCollection,
  listCollectionProducts,
  SORTS,
  type Collection,
  type ProductListFilters,
  type Sort,
} from "@/lib/data/catalog";
import { fibreLabel } from "@/lib/domain/claims";
import { FIBRES, type Fibre } from "@/lib/domain/enums";
import { breadcrumbJsonLd, faqPageJsonLd, type BreadcrumbItem } from "@/lib/seo/jsonld";
import { collectionMetadata } from "@/lib/seo/metadata";
import { resolveCollectionIndexability } from "@/lib/seo/indexability";
import { cn } from "@/lib/utils";

import { ProductGrid } from "./product-card";

type SearchParams = Record<string, string | string[] | undefined>;

const SORT_LABELS: Record<Sort, string> = {
  featured: "Featured",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function parseFilters(sp: SearchParams): ProductListFilters {
  const fibre = first(sp.fibre);
  const sort = first(sp.sort);
  const page = Number(first(sp.page) ?? 1);
  return {
    fibre: fibre && (FIBRES as readonly string[]).includes(fibre) ? (fibre as Fibre) : undefined,
    colour: first(sp.colour)?.slice(0, 40) || undefined,
    sort: sort && (SORTS as readonly string[]).includes(sort) ? (sort as Sort) : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function breadcrumbsFor(c: Collection): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [{ name: "Home", path: routes.home }];
  if (c.section === "sarees") trail.push({ name: "Sarees", path: routes.sarees });
  if (c.section === "fabric") trail.push({ name: "Fabric by the metre", path: routes.fabric });
  trail.push({ name: c.title, path: c.path });
  return trail;
}

/** Metadata for any listing page; canonical/noindex follow src/lib/seo/indexability. */
export async function collectionPageMetadata(
  path: string,
  searchParams: Promise<SearchParams>,
): Promise<Metadata> {
  const [collection, sp] = await Promise.all([getCollection(path), searchParams]);
  if (!collection) return {};
  const indexability = resolveCollectionIndexability(path, sp);
  return collectionMetadata({
    path,
    name: collection.title,
    seoTitle: collection.seoTitle,
    seoDescription: collection.seoDescription,
    intro: collection.intro,
    canonical: indexability.canonical,
    noindex: collection.noindex || indexability.noindex,
    page: indexability.page,
  });
}

async function Header({ path }: { path: string }) {
  "use cache";
  const collection = await getCollection(path);
  if (!collection) notFound();
  const trail = breadcrumbsFor(collection);
  return (
    <header className="container-page space-y-4 pt-8 pb-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1 text-sm text-muted-foreground">
          {trail.map((item, i) => (
            <li key={item.path} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {i === trail.length - 1 ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link href={item.path} className="hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <h1 className="font-display text-display-xl">{collection.h1 ?? collection.title}</h1>
      {collection.intro && <p className="max-w-3xl text-muted-foreground">{collection.intro}</p>}
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </header>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      rel="nofollow"
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3 text-sm transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-charcoal-500",
      )}
    >
      {children}
    </Link>
  );
}

async function Results({ path, searchParams }: { path: string; searchParams: Promise<SearchParams> }) {
  const collection = await getCollection(path);
  if (!collection) notFound();
  const filters = parseFilters(await searchParams);
  const result = await listCollectionProducts(collection, filters);
  const sort = filters.sort ?? collection.defaultSort;

  // Links keep every other active filter and reset to page 1.
  const href = (patch: Partial<Record<"fibre" | "colour" | "sort" | "page", string | undefined>>) =>
    withQuery(path, {
      fibre: filters.fibre,
      colour: filters.colour,
      sort: filters.sort,
      ...patch,
      page: patch.page,
    });

  return (
    <div className="container-page space-y-6">
      <div className="flex flex-col gap-4 border-y border-border py-4">
        {result.facets.fibres.length > 1 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by fabric">
            <span className="mr-1 text-sm font-medium">Fabric</span>
            <FilterChip href={href({ fibre: undefined })} active={!filters.fibre}>
              All
            </FilterChip>
            {result.facets.fibres.map((f) => (
              <FilterChip key={f} href={href({ fibre: f })} active={filters.fibre === f}>
                {fibreLabel(f)}
              </FilterChip>
            ))}
          </div>
        )}
        {result.facets.colours.length > 1 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by colour">
            <span className="mr-1 text-sm font-medium">Colour</span>
            <FilterChip href={href({ colour: undefined })} active={!filters.colour}>
              All
            </FilterChip>
            {result.facets.colours.map((c) => (
              <FilterChip key={c} href={href({ colour: c.toLowerCase() })} active={filters.colour?.toLowerCase() === c.toLowerCase()}>
                {c}
              </FilterChip>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {result.total} {result.total === 1 ? "piece" : "pieces"}
          </p>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sort">
            <span className="text-sm font-medium">Sort</span>
            {SORTS.map((s) => (
              <FilterChip key={s} href={href({ sort: s === collection.defaultSort ? undefined : s })} active={sort === s}>
                {SORT_LABELS[s]}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {result.products.length === 0 ? (
        <EmptyState
          title="Nothing woven in this combination yet"
          description="Try another fabric or colour, or ask us on WhatsApp — many pieces can be made to order."
          action={
            <Link href={path} className="underline">
              Clear filters
            </Link>
          }
        />
      ) : (
        <ProductGrid products={result.products} priorityCount={4} />
      )}

      {result.pageCount > 1 && (
        <nav aria-label="Pagination" className="flex justify-center gap-2 pt-4">
          {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: n === 1 ? undefined : String(n) })}
              aria-current={n === result.page ? "page" : undefined}
              className={cn(
                "grid size-10 place-items-center rounded-md border text-sm",
                n === result.page ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent",
              )}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

async function Footer({ path }: { path: string }) {
  "use cache";
  const collection = await getCollection(path);
  if (!collection || (!collection.body && collection.faqs.length === 0)) return null;
  const faqLd = faqPageJsonLd(collection.faqs);
  return (
    <section className="container-page mt-16 grid gap-10 md:grid-cols-2">
      {collection.body && (
        <div className="prose max-w-none space-y-3 text-muted-foreground">
          <ZariDivider className="mb-6 w-24" />
          <p>{collection.body}</p>
        </div>
      )}
      {collection.faqs.length > 0 && (
        <div>
          <h2 className="font-display text-display-sm">Questions about {collection.title.toLowerCase()}</h2>
          <Accordion type="single" collapsible className="mt-4">
            {collection.faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {faqLd && <JsonLd data={faqLd} />}
        </div>
      )}
    </section>
  );
}

function ResultsSkeleton() {
  return (
    <div className="container-page grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="aspect-[4/5] rounded-md" />
      ))}
    </div>
  );
}

/** Shared template for every catalogue listing (sections, collections, occasions, price bands). */
export function CollectionView({ path, searchParams }: { path: string; searchParams: Promise<SearchParams> }) {
  return (
    <>
      <Header path={path} />
      <Suspense fallback={<ResultsSkeleton />}>
        <Results path={path} searchParams={searchParams} />
      </Suspense>
      <Footer path={path} />
    </>
  );
}
