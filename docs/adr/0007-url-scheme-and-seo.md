# 0007. URL scheme, canonicals and indexability

- Status: accepted
- Date: 2026-10-31
- Source: [kickoff brief](../kickoff.md), "Information architecture", "Technical SEO" and "Keyword clusters"

## Context and problem statement

The SEO goal is to own every "Bhagalpur", "tussar", "raw silk" and "matka" search. Every common
search intent needs a crawlable landing page with a clean, stable URL, while filter and sort
combinations must not create thousands of thin duplicates. All parts of the app (navigation,
sitemaps, JSON-LD, redirects, tests) must agree on one URL map.

## Decision outcome

### URL map (canonical; no trailing slashes)

The brief writes paths with trailing slashes (`/sarees/tussar-silk/`); we standardise on **no trailing
slash**, which is Next.js's default (`/sarees/tussar-silk/` permanently redirects to
`/sarees/tussar-silk`).

**Storefront**

| Area                | Routes                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                | `/`                                                                                                                                                                                   |
| Sarees              | `/sarees`, `/sarees/[collection]`: `tussar-silk`, `raw-silk`, `matka-silk`, `ghicha-silk`, `cotton-silk`, `linen`, `zari-bridal`, `bhagalpuri-silk`, `new-arrivals`                   |
| Fabric by the metre | `/fabric`, `/fabric/[collection]`: `raw-silk`, `tussar-silk`, `matka-silk`, `linen-stripe`, `cotton-silk`, `swatches`                                                                 |
| Other lines         | `/stoles-dupattas`, `/dress-material`, `/kurta-fabric`, `/home-furnishing`                                                                                                            |
| Occasion            | `/occasion/[occasion]`: `office`, `festive`, `wedding`, `puja`, `gifting`                                                                                                             |
| Price               | `/shop/under-3000`, `/shop/3000-to-7000`, `/shop/above-7000`                                                                                                                          |
| Product             | `/products/[slug]`                                                                                                                                                                    |
| Search              | `/search`                                                                                                                                                                             |
| The craft           | `/our-story`, `/weavers`, `/weavers/[slug]`, `/guides/[slug]`: `bhagalpur-silk-guide`, `silk-types-explained`, `how-to-verify-silk-mark`, `saree-care`; `/journal`, `/journal/[slug]` |
| Help                | `/help/shipping`, `/help/returns`, `/help/faq`, `/track-order`, `/contact`, `/bulk-enquiries`                                                                                         |
| Legal               | `/legal/[slug]`: `terms`, `privacy`, `shipping-policy`, `returns-policy`, `cancellation`; `/grievance`                                                                                |
| Cart and checkout   | `/cart`, `/checkout`, `/checkout/confirmation/[orderNumber]`                                                                                                                          |
| Account             | `/login`, `/account`, `/account/orders`, `/account/orders/[orderNumber]`, `/account/addresses`, `/account/wishlist`, `/account/privacy`                                               |

**Admin** (`/admin/*`): `login`, dashboard, `products` (`new`, `[id]`), `collections`, `media`,
`authenticity`, `inventory`, `orders` (`[id]`), `shipments`, `returns`, `customers` (`[id]`),
`reviews`, `content`, `promotions`, `reports`, `grievances`, `privacy-requests`, `settings`
(`staff`), `audit-log`.

**API**: `/api/health`, `/api/webhooks/razorpay`, `/api/cron/release-reservations`, `/api/cron/nightly`.

Rules:

- Products live at `/products/[slug]` regardless of collection, so a piece in three collections has
  one URL. Breadcrumbs follow the product's primary collection.
- Slugs are lowercase, hyphenated, ASCII, and describe the piece (`tussar-ghicha-saree-madder-red-zari-border`),
  never an internal SKU. Renaming a slug creates a 301 in the admin redirect manager automatically.
- Fibre collections lead the navigation in the brief's order: tussar and matka first.
- The `/sarees/bhagalpuri-silk` landing page lists only GI-eligible pieces ([ADR 0005](0005-compliance-by-design.md)).

### Canonicals and indexing

| Page type                                                                            | Indexing                                                      | Canonical                                                               |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Home, collection, occasion, price, product, craft, guide, journal, help, legal pages | index, follow                                                 | Self, absolute, without query string                                    |
| Collection with sort (`?sort=`) or pagination beyond page 1                          | index, follow                                                 | Sort: the unsorted collection. Pagination: self (`?page=2`), not page 1 |
| Collection with **one** filter value that has its own landing page (e.g. fibre)      | index, follow                                                 | The landing page (`/sarees?fibre=tussar` → `/sarees/tussar-silk`)       |
| Other filter combinations (colour, weave, zari, blouse included, multiple values)    | **noindex, follow**                                           | The unfiltered collection                                               |
| Search results `/search`                                                             | noindex, follow                                               | n/a                                                                     |
| Cart, checkout, confirmation, login, account, admin, API                             | noindex, nofollow (also `X-Robots-Tag` from `next.config.ts`) | n/a                                                                     |
| Empty collection (no published products)                                             | noindex, follow until it has products                         | Self                                                                    |

- Indexability is decided by one pure function in `src/lib/seo/` so every template applies the
  same rules, and it is unit-tested.
- `robots.ts` disallows `/admin`, `/api`, `/cart`, `/checkout`, `/account` and points to the sitemap.
- Sitemaps are split by products, collections and articles and only list indexable, published URLs.
- Every template emits JSON-LD: `Organization` and `WebSite` with `SearchAction` (home);
  `BreadcrumbList` (all deep pages); `Product` / `ProductGroup` with `Offer` (INR price,
  availability, `shippingDetails`, `hasMerchantReturnPolicy`), `AggregateRating` and `Review` only
  when real reviews exist; `Article` for guides and journal; `FAQPage` only where the FAQ is visible.
- Editable SEO title, meta description, slug, Open Graph image and alt text for products,
  collections and pages in the admin.
- Phase 2 Hindi pages will live under `/hi/...` with `hreflang` pairs; copy keys are i18n-ready now.

### Consequences

- Good: one place (this ADR plus `src/lib/seo/`) defines URLs and indexability; tests assert them.
- Good: filter pages stay usable for shoppers without diluting crawl budget.
- Bad: new collections need a code change to the slug lists until collections become fully
  CMS-driven; acceptable for MVP because the IA is fixed by the brief.
