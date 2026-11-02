# 0006. Caching and rendering with Cache Components

- Status: accepted
- Date: 2026-10-31
- Source: [kickoff brief](../kickoff.md), "Performance targets" and "Technical SEO"; Next.js 16 docs in
  `node_modules/next/dist/docs/` (`01-getting-started/08-caching.md`,
  `02-guides/authentication-with-cache-components.md`, `02-guides/content-security-policy.md`)

## Context and problem statement

The storefront must hit mobile LCP ≤ 2.5 s and INP ≤ 200 ms on mid-range Android phones, be fully
server-rendered for SEO, and stay within free-tier database and egress limits. The same app also
serves per-user pages (cart, account, admin) whose data must never leak into a shared cache. Next.js
16 with `cacheComponents: true` prerenders a static shell and streams dynamic parts; anything that
reads runtime data (`cookies()`, `headers()`, `searchParams`) must sit inside `<Suspense>`, and a
`"use cache"` function cannot read cookies. How do we split cached and per-request work?

## Decision outcome

### Public catalogue: cached and tagged

- Catalogue, CMS and content reads (products, collections, weavers, guides, journal, navigation,
  legal pages) are `"use cache"` functions in `src/lib/data/` with an explicit `cacheLife` and
  `cacheTag`. Tags name the entity type plus one tag per record: `products` and `product:<slug>`,
  `collections` and `collection:<slug>`, `nav`, `page:<slug>`.
- These functions use the **cookie-less public Supabase client** (anon key, no session, no cookie
  access). RLS on the anon role exposes only published rows, so a cached result can never contain a
  draft or another user's data.
- Default lifetime `cacheLife("days")`; the real freshness comes from tags.
- **Admin publish invalidates**: admin Server Actions that change catalogue data call `updateTag(...)`
  for the affected tags (read-your-own-writes, no stale price shown after a save). Route handlers and
  cron jobs that change catalogue data call `revalidateTag(tag, "max")` (stale-while-revalidate).
  Scheduled publishing is handled by the nightly and per-minute jobs revalidating the tags they touch.
- Sitemaps and `robots.txt` read the same tagged functions, so they update when admins publish.

### Per-user and fast-changing data: dynamic, inside Suspense

- Cart count, signed-in state, wishlist hearts, account pages and the whole admin read the session
  with the cookie-bound server client inside `<Suspense>` boundaries; the static shell renders a
  skeleton of the same size (no layout shift).
- **Stock availability and the "in someone's checkout" state are never cached**: they are read at
  request time in a small dynamic component on product and collection pages, because a reservation
  can change them within seconds ([ADR 0003](0003-one-of-a-kind-stock-reservations.md)).
- Prices displayed come from the cached catalogue; the cart and checkout always recompute totals from
  the database, so a stale cached price can never be charged.
- Route handlers that must not be prerendered call `await connection()` (see
  `src/app/api/health/route.ts`).
- Admin auth follows the "authentication with Cache Components" guide: `proxy.ts` only refreshes the
  Supabase session and does an optimistic redirect; the authoritative role check happens in the data
  layer next to every query and Server Action.

### Content Security Policy without nonces

A nonce-based CSP needs a fresh nonce per request, which forces every page to render dynamically and
is incompatible with the prerendered static shell (the Next.js CSP guide says Partial Prerendering is
incompatible with nonces). We therefore use a **static allow-list CSP set in `next.config.ts`**:

- `script-src 'self' 'unsafe-inline'` plus Razorpay Checkout, Google Tag Manager and Microsoft Clarity
  (`'unsafe-inline'` is required for Next's inline RSC payload scripts without nonces; `'unsafe-eval'`
  only in development).
- `connect-src` / `img-src` for Supabase (cloud and local), Razorpay, GA4 and Clarity; `frame-src` for
  Razorpay; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`.
- Compensating controls: React escapes output by default; we never use `dangerouslySetInnerHTML`
  except for JSON-LD built from typed objects (with `<` escaped); third-party script origins are
  pinned; `X-Frame-Options: DENY`, HSTS, `nosniff`, a strict Referrer-Policy and Permissions-Policy.
- Revisit when Next's experimental SRI (hash-based CSP that keeps static generation) becomes stable.

### Images

`next/image` serves AVIF/WebP with mobile-first `deviceSizes` from Supabase Storage public URLs only
(`remotePatterns`), with a 31-day `minimumCacheTTL`: uploads always get new object paths, so long
caching is safe and keeps Supabase egress inside the free tier. Full-resolution zoom images load
lazily.

### Consequences

- Good: most storefront HTML is a prerendered shell served from the CDN with dynamic islands
  streamed in, which is the shortest path to the LCP target.
- Good: cached reads cannot leak private data, because they cannot see cookies and RLS limits the
  anon role to published content.
- Bad: every new data function must choose deliberately between "cached + tagged" and "dynamic in
  Suspense"; reviewers check this. Forgetting a tag means a publish does not appear until the
  `cacheLife` window ends.
- Bad: `'unsafe-inline'` scripts weaken XSS protection compared with nonces; accepted for performance,
  with the compensating controls above.

## More information

- [ADR 0007: URL scheme and SEO](0007-url-scheme-and-seo.md)
