/** Never a real slug: slugs are lowercase letters, digits and hyphens. */
export const PLACEHOLDER_SLUG = "__placeholder__";

/**
 * With Cache Components, generateStaticParams must return at least one param or the build fails
 * (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md).
 * Database-driven routes (products, weavers) can be empty, e.g. right after the demo catalogue is
 * cleared, so fall back to a placeholder that the page turns into notFound().
 */
export function slugParamsOrPlaceholder(slugs: readonly string[]): { slug: string }[] {
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: PLACEHOLDER_SLUG }];
}
