/**
 * URL slugs are lowercase ASCII words joined by hyphens (`/sarees/tussar-silk`). Non-Latin text
 * such as Devanagari is dropped rather than transliterated badly; Hindi pages (phase 2) get
 * their slugs written by hand.
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DEFAULT_SLUG_MAX_LENGTH = 80;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

function truncateAtWord(slug: string, maxLength: number): string {
  if (slug.length <= maxLength) return slug;
  const cut = slug.slice(0, maxLength);
  const lastHyphen = cut.lastIndexOf("-");
  // Keep a partial word only when the first word alone is longer than the limit.
  return (lastHyphen > 0 ? cut.slice(0, lastHyphen) : cut).replace(/-+$/, "");
}

export function slugify(
  input: string,
  options: { maxLength?: number; fallback?: string } = {},
): string {
  const { maxLength = DEFAULT_SLUG_MAX_LENGTH, fallback = "" } = options;
  const slug = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // combining accents: "Kantha Café" → "kantha cafe"
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "") // "Weaver's" → "weavers"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const truncated = truncateAtWord(slug, maxLength);
  return truncated || fallback;
}

/**
 * Returns `base` if free, otherwise `base-2`, `base-3`… keeping within `maxLength`.
 * `isTaken` can wrap a Set lookup or a pre-fetched list of existing slugs.
 */
export function uniqueSlug(
  base: string,
  taken: Iterable<string> | ((slug: string) => boolean),
  maxLength = DEFAULT_SLUG_MAX_LENGTH,
): string {
  let isTaken: (slug: string) => boolean;
  if (typeof taken === "function") {
    isTaken = taken;
  } else {
    const existing = new Set(taken);
    isTaken = (slug) => existing.has(slug);
  }
  const root = truncateAtWord(base, maxLength);
  if (!root) throw new RangeError("Cannot make a unique slug from an empty base");
  if (!isTaken(root)) return root;
  for (let n = 2; n < 10_000; n++) {
    const suffix = `-${n}`;
    const candidate = `${truncateAtWord(root, maxLength - suffix.length)}${suffix}`;
    if (!isTaken(candidate)) return candidate;
  }
  throw new RangeError(`No free slug for "${base}"`);
}
