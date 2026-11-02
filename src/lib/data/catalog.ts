import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { Fibre, Occasion, ProductKind, SellUnit } from "@/lib/domain/enums";
import { createPublicClient } from "@/lib/supabase/public";

import { productMediaUrl } from "./media";

/** Tag every public catalogue read so admin publishes can `revalidateTag(CATALOG_TAG)`. */
export const CATALOG_TAG = "catalog";
export const PAGE_SIZE = 24;

export const SORTS = ["featured", "newest", "price_asc", "price_desc"] as const;
export type Sort = (typeof SORTS)[number];

export interface CollectionRules {
  kinds?: ProductKind[];
  /** E.g. price bands exclude fabric, whose price is per metre rather than per piece. */
  exclude_kinds?: ProductKind[];
  fibres?: Fibre[];
  occasions?: Occasion[];
  has_zari?: boolean;
  gi_eligible?: boolean;
  swatch_available?: boolean;
  new_within_days?: number;
  price_min_paise?: number;
  /** Exclusive upper bound, so adjacent price bands never overlap. */
  price_max_paise?: number;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface Collection {
  id: string;
  section: string;
  slug: string;
  path: string;
  title: string;
  h1: string | null;
  intro: string | null;
  body: string | null;
  faqs: Faq[];
  membership: "rule" | "manual";
  rules: CollectionRules;
  defaultSort: Sort;
  seoTitle: string | null;
  seoDescription: string | null;
  noindex: boolean;
}

export interface ProductImage {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface ProductCard {
  id: string;
  slug: string;
  title: string;
  kind: ProductKind;
  primaryFibre: Fibre;
  priceMinPaise: number;
  priceMaxPaise: number;
  sellUnit: SellUnit;
  isOneOfAKind: boolean;
  madeToOrder: boolean;
  giEligible: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  image: ProductImage | null;
  hoverImage: ProductImage | null;
  colours: string[];
}

export interface ProductListFilters {
  fibre?: Fibre;
  colour?: string;
  sort?: Sort;
  page?: number;
}

const CARD_SELECT = `
  id, slug, title, kind, primary_fibre, price_min_paise, price_max_paise, is_one_of_a_kind,
  made_to_order, gi_eligible, rating_avg, rating_count, featured_rank, published_at,
  product_media ( storage_path, alt, sort, kind, width, height ),
  product_variants ( colour, sell_unit, position, active )
` as const;

type CardRow = {
  id: string;
  slug: string;
  title: string;
  kind: ProductKind;
  primary_fibre: Fibre;
  price_min_paise: number | null;
  price_max_paise: number | null;
  is_one_of_a_kind: boolean;
  made_to_order: boolean;
  gi_eligible: boolean;
  rating_avg: number | null;
  rating_count: number;
  product_media: {
    storage_path: string;
    alt: string;
    sort: number;
    kind: string;
    width: number | null;
    height: number | null;
  }[];
  product_variants: {
    colour: string | null;
    sell_unit: SellUnit;
    position: number;
    active: boolean;
  }[];
};

function toImage(m: CardRow["product_media"][number] | undefined): ProductImage | null {
  return m ? { url: productMediaUrl(m.storage_path), alt: m.alt, width: m.width, height: m.height } : null;
}

function toCard(row: CardRow): ProductCard {
  const images = row.product_media.filter((m) => m.kind === "image").sort((a, b) => a.sort - b.sort);
  const variants = row.product_variants.filter((v) => v.active).sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    primaryFibre: row.primary_fibre,
    priceMinPaise: row.price_min_paise ?? 0,
    priceMaxPaise: row.price_max_paise ?? row.price_min_paise ?? 0,
    sellUnit: variants[0]?.sell_unit ?? "piece",
    isOneOfAKind: row.is_one_of_a_kind,
    madeToOrder: row.made_to_order,
    giEligible: row.gi_eligible,
    ratingAvg: row.rating_avg === null ? null : Number(row.rating_avg),
    ratingCount: row.rating_count,
    image: toImage(images[0]),
    hoverImage: toImage(images[1]),
    colours: [...new Set(variants.map((v) => v.colour).filter((c): c is string => Boolean(c)))],
  };
}

export async function getCollection(path: string): Promise<Collection | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("collections")
    .select("id, section, slug, path, title, h1, intro, body, faqs, membership, rules, default_sort, seo_title, seo_description, noindex")
    .eq("path", path)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    section: data.section,
    slug: data.slug,
    path: data.path ?? path,
    title: data.title,
    h1: data.h1,
    intro: data.intro,
    body: data.body,
    faqs: Array.isArray(data.faqs) ? (data.faqs as unknown as Faq[]) : [],
    membership: data.membership as Collection["membership"],
    rules: (data.rules ?? {}) as CollectionRules,
    defaultSort: (SORTS as readonly string[]).includes(data.default_sort)
      ? (data.default_sort as Sort)
      : "featured",
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    noindex: data.noindex,
  };
}

export interface ProductPage {
  products: ProductCard[];
  total: number;
  page: number;
  pageCount: number;
  /** Facet values present in this collection (before the active filters), for the filter UI. */
  facets: { fibres: Fibre[]; colours: string[] };
}

/** Products matching a collection's rules (or manual list), filtered, sorted and paginated. */
export async function listCollectionProducts(
  collection: Pick<Collection, "id" | "membership" | "rules" | "defaultSort">,
  filters: ProductListFilters = {},
): Promise<ProductPage> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const supabase = createPublicClient();
  const rules = collection.rules;
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const sort = filters.sort ?? collection.defaultSort;

  let manualIds: string[] | null = null;
  if (collection.membership === "manual") {
    const { data, error } = await supabase
      .from("collection_products")
      .select("product_id")
      .eq("collection_id", collection.id);
    if (error) throw error;
    manualIds = data.map((r) => r.product_id);
  }

  // The base query applies the collection's own rules; facets come from this unfiltered set.
  const base = () => {
    let q = supabase.from("products").select(CARD_SELECT, { count: "exact" });
    if (manualIds) q = q.in("id", manualIds.length ? manualIds : ["00000000-0000-0000-0000-000000000000"]);
    if (rules.kinds?.length) q = q.in("kind", rules.kinds);
    if (rules.exclude_kinds?.length) q = q.not("kind", "in", `(${rules.exclude_kinds.join(",")})`);
    if (rules.fibres?.length) q = q.in("primary_fibre", rules.fibres);
    if (rules.occasions?.length) q = q.overlaps("occasions", rules.occasions);
    if (rules.has_zari) q = q.not("zari", "is", null);
    if (rules.gi_eligible !== undefined) q = q.eq("gi_eligible", rules.gi_eligible);
    if (rules.swatch_available !== undefined) q = q.eq("swatch_available", rules.swatch_available);
    if (rules.price_min_paise !== undefined) q = q.gte("price_min_paise", rules.price_min_paise);
    if (rules.price_max_paise !== undefined) q = q.lt("price_min_paise", rules.price_max_paise);
    if (rules.new_within_days) {
      const since = new Date(Date.now() - rules.new_within_days * 86_400_000).toISOString();
      q = q.gte("published_at", since);
    }
    return q;
  };

  const { data: all, error: facetError } = await base();
  if (facetError) throw facetError;
  const allCards = (all as unknown as CardRow[]).map(toCard);
  const facets = {
    fibres: [...new Set(allCards.map((p) => p.primaryFibre))],
    colours: [...new Set(allCards.flatMap((p) => p.colours))].sort(),
  };

  let filtered = allCards;
  if (filters.fibre) filtered = filtered.filter((p) => p.primaryFibre === filters.fibre);
  if (filters.colour) {
    const colour = filters.colour.toLowerCase();
    filtered = filtered.filter((p) => p.colours.some((c) => c.toLowerCase() === colour));
  }

  // Catalogue is small (hundreds of products), so sorting and paging in memory keeps one cached
  // round-trip per collection. Move to SQL ordering/range if it grows past a few thousand.
  const rows = all as unknown as (CardRow & { featured_rank: number | null; published_at: string | null })[];
  const meta = new Map(rows.map((r) => [r.id, r]));
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return a.priceMinPaise - b.priceMinPaise;
      case "price_desc":
        return b.priceMinPaise - a.priceMinPaise;
      case "newest":
        return (meta.get(b.id)?.published_at ?? "").localeCompare(meta.get(a.id)?.published_at ?? "");
      default: {
        const ra = meta.get(a.id)?.featured_rank ?? Number.MAX_SAFE_INTEGER;
        const rb = meta.get(b.id)?.featured_rank ?? Number.MAX_SAFE_INTEGER;
        return ra - rb || a.title.localeCompare(b.title);
      }
    }
  });

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    products: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    page,
    pageCount,
    facets,
  };
}

/** Featured products for the home page; falls back to newest when nothing is ranked. */
export async function listFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select(CARD_SELECT)
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as unknown as CardRow[]).map(toCard);
}

export async function listProductsInCollection(path: string, limit = 8): Promise<ProductCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const collection = await getCollection(path);
  if (!collection) return [];
  const { products } = await listCollectionProducts(collection, { sort: collection.defaultSort });
  return products.slice(0, limit);
}

export async function searchProducts(query: string, limit = 24): Promise<ProductCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const q = query.trim();
  if (q.length < 2) return [];
  const supabase = createPublicClient();
  const { data: hits, error } = await supabase.rpc("search_products", { p_query: q, p_limit: limit });
  if (error) throw error;
  const ids = (hits ?? []).map((h: { id: string }) => h.id);
  if (ids.length === 0) return [];

  const { data, error: cardError } = await supabase.from("products").select(CARD_SELECT).in("id", ids);
  if (cardError) throw cardError;
  const byId = new Map((data as unknown as CardRow[]).map((r) => [r.id, toCard(r)]));
  return ids.map((id: string) => byId.get(id)).filter((p): p is ProductCard => Boolean(p));
}

/** Published product slugs, for generateStaticParams and the sitemap. */
export async function listProductSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient().from("products").select("slug, updated_at");
  if (error) throw error;
  return data.map((p) => ({ slug: p.slug, updatedAt: p.updated_at }));
}
