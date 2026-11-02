/**
 * Indexing rules for collection-style listing pages (sections, collections, occasion and
 * price pages) with query parameters. Goal: one indexable URL per distinct, useful listing,
 * and no crawl budget spent on thin filter combinations.
 *
 * Rules (matrix tested in indexability.test.ts):
 * - Tracking params (utm_*, gclid, fbclid…) and empty values are ignored entirely.
 * - `sort` never creates an indexable variant: the canonical drops it. Robots stay
 *   index,follow because the canonical already consolidates the duplicate; Google advises
 *   against pairing noindex with a cross-URL canonical.
 * - `page`: page 1 canonicalises to the URL without `page`. Page 2+ is self-canonical and
 *   indexable, as Google recommends for pagination (it ignores rel=prev/next, and pointing
 *   page 2 at page 1 would hide the products listed only on page 2). Paginated pages get a
 *   unique title via collectionMetadata({ page }).
 * - Exactly one value of one whitelisted facet (default colour or fibre) is indexable with its
 *   own canonical, e.g. /sarees/tussar-silk?colour=red (values lowercased).
 * - Two or more facet values, any other parameter, an invalid page, or an empty result set
 *   -> noindex,follow with the canonical pointing at the bare base path.
 */

export const SORT_PARAM = "sort";
export const PAGE_PARAM = "page";
export const DEFAULT_INDEXABLE_FACETS = ["colour", "fibre"] as const;

const TRACKING_PARAM =
  /^(utm_[a-z_]+|gclid|gbraid|wbraid|dclid|fbclid|msclkid|srsltid|igshid|mc_cid|mc_eid|_ga|_gl)$/i;

/** Next.js `searchParams` (after awaiting) or a URLSearchParams instance. */
export type SearchParamsRecord = Record<string, string | string[] | undefined>;
export type SearchParamsLike = SearchParamsRecord | URLSearchParams;

export function isTrackingParam(key: string): boolean {
  return TRACKING_PARAM.test(key);
}

export function toSearchParams(input: SearchParamsLike): URLSearchParams {
  if (input instanceof URLSearchParams) return new URLSearchParams(input);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  return params;
}

export interface NormalizeOptions {
  /** Keys to drop in addition to tracking params. */
  drop?: readonly string[];
  /** Keys to keep; when given, every other key is dropped. */
  keep?: readonly string[];
  /** Lowercase values (facet values are case-insensitive; search queries are not). */
  lowercaseValues?: boolean;
}

/**
 * Stable query string: tracking params and empty values removed, values trimmed and
 * de-duplicated, keys and values sorted. Returns "" or a string starting with "?".
 */
export function normalizeQueryString(
  input: SearchParamsLike,
  options: NormalizeOptions = {},
): string {
  const grouped = new Map<string, Set<string>>();
  for (const [rawKey, rawValue] of toSearchParams(input)) {
    const key = rawKey.trim();
    if (!key || isTrackingParam(key)) continue;
    if (options.drop?.includes(key)) continue;
    if (options.keep && !options.keep.includes(key)) continue;
    const trimmed = rawValue.trim();
    const value = options.lowercaseValues ? trimmed.toLowerCase() : trimmed;
    if (!value) continue;
    if (!grouped.has(key)) grouped.set(key, new Set());
    grouped.get(key)!.add(value);
  }
  const out = new URLSearchParams();
  for (const key of [...grouped.keys()].sort()) {
    for (const value of [...grouped.get(key)!].sort()) out.append(key, value);
  }
  const qs = out.toString();
  return qs ? `?${qs}` : "";
}

/** 1-based page number from searchParams; anything invalid reads as page 1. */
export function pageFromSearchParams(input: SearchParamsLike): number {
  return parsePage(toSearchParams(input).getAll(PAGE_PARAM)) ?? 1;
}

/** null when the page value is present but invalid (not a single positive integer). */
function parsePage(values: readonly string[]): number | null {
  const nonEmpty = values.map((v) => v.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return 1;
  if (nonEmpty.length > 1 || !/^\d{1,6}$/.test(nonEmpty[0])) return null;
  const page = Number(nonEmpty[0]);
  return page >= 1 ? page : null;
}

export type IndexabilityReason =
  | "base"
  | "sorted"
  | "paginated"
  | "single_facet"
  | "multiple_facets"
  | "non_whitelisted_param"
  | "invalid_page"
  | "empty_results";

export interface Indexability {
  /** Canonical path (with normalised query when the variant is indexable). */
  canonical: string;
  noindex: boolean;
  robots: { index: boolean; follow: true };
  reason: IndexabilityReason;
  /** Page number to render (1 when absent or invalid). */
  page: number;
}

export interface IndexabilityOptions {
  /** Facets allowed to create indexable variants on this page. */
  indexableFacets?: readonly string[];
  /** Number of products the listing shows; 0 makes the page noindex (soft-404 guard). */
  resultCount?: number;
}

export function resolveCollectionIndexability(
  basePath: string,
  searchParams: SearchParamsLike,
  options: IndexabilityOptions = {},
): Indexability {
  const base = basePath.length > 1 ? basePath.replace(/\/+$/, "") : basePath;
  const facets = options.indexableFacets ?? DEFAULT_INDEXABLE_FACETS;
  const params = toSearchParams(searchParams);

  let sorted = false;
  const pageValues: string[] = [];
  const facetValues = new Map<string, Set<string>>();
  let hasOtherParam = false;

  for (const [key, rawValue] of params) {
    const value = rawValue.trim();
    if (!value || isTrackingParam(key)) continue;
    if (key === SORT_PARAM) sorted = true;
    else if (key === PAGE_PARAM) pageValues.push(value);
    else if (facets.includes(key)) {
      // "colour=red,blue" is two values, same as "colour=red&colour=blue".
      for (const part of value.split(",")) {
        const v = part.trim().toLowerCase();
        if (!v) continue;
        if (!facetValues.has(key)) facetValues.set(key, new Set());
        facetValues.get(key)!.add(v);
      }
    } else hasOtherParam = true;
  }

  const parsedPage = parsePage(pageValues);
  const page = parsedPage ?? 1;
  const facetValueCount = [...facetValues.values()].reduce((n, set) => n + set.size, 0);

  const excluded = (reason: IndexabilityReason): Indexability => ({
    canonical: base,
    noindex: true,
    robots: { index: false, follow: true },
    reason,
    page,
  });

  if (hasOtherParam) return excluded("non_whitelisted_param");
  if (parsedPage === null) return excluded("invalid_page");
  if (facetValueCount > 1) return excluded("multiple_facets");
  if (options.resultCount === 0) return excluded("empty_results");

  const canonicalParams = new URLSearchParams();
  for (const [key, values] of facetValues) canonicalParams.append(key, [...values][0]);
  if (page > 1) canonicalParams.append(PAGE_PARAM, String(page));

  const reason: IndexabilityReason =
    page > 1 ? "paginated" : facetValueCount === 1 ? "single_facet" : sorted ? "sorted" : "base";

  return {
    canonical: `${base}${normalizeQueryString(canonicalParams)}`,
    noindex: false,
    robots: { index: true, follow: true },
    reason,
    page,
  };
}
