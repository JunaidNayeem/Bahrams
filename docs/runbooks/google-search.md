# Runbook: publishing bahramsilk.com on Google

What the code already does, what to set up once, and how to check it. The keyword plan behind
page titles and descriptions is `src/config/keyword-map.ts`.

## Built in

| Item                                                                                                                                                                                     | Where                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `robots.txt`: crawl the store; keep out admin, account, cart, checkout, API, search results                                                                                              | `src/app/robots.ts` → `buildRobots()`                                        |
| Sitemap index at `/sitemap.xml` → static pages, collections, products (with photos)                                                                                                      | `src/app/sitemap-index.xml/route.ts`, `src/app/sitemap.ts`                   |
| Canonical, title, description, Open Graph and X cards on every page                                                                                                                      | `src/lib/seo/metadata.ts`                                                    |
| `noindex` on cart, checkout, account, login, search, sample weavers, placeholders, thin filters                                                                                          | page metadata + `src/lib/seo/indexability.ts`                                |
| Structured data: Organization, WebSite (sitelinks search), Product/ProductGroup with offers, shipping and returns, BreadcrumbList, FAQPage, AboutPage/WebPage/ContactPage, ClothingStore | `src/lib/seo/jsonld.ts`, `product-jsonld.ts`                                 |
| Favicon, app icons, web manifest, default share image                                                                                                                                    | `src/app/icon.svg`, `apple-icon.png`, `manifest.ts`, `public/og/default.jpg` |
| Only the Production deployment is indexable; Vercel previews send `noindex` and block robots                                                                                             | `isSiteIndexable()`, `next.config.ts`                                        |

## Before you submit

Google will index whatever is on the site. Fix these first, because they make public claims:

- [ ] **Replace the sample catalogue.** Seeded products carry fake Silk Mark numbers containing
      "SAMPLE" and fictional weavers. Real records only (CLAUDE.md: claims need records).
- [ ] Real contact details, legal entity, address and grievance officer (Admin → Settings), and the
      `TODO(client)` values in `src/config/site.ts` (phone, WhatsApp, social profile links).
- [ ] Real product photos with descriptive alt text (Admin → Products → media).
- [ ] Mailboxes exist for `care@`, `grievance@` and `orders@bahramsilk.com`.

## One-time setup

1. **Vercel → Domains:** add `bahramsilk.com` and `www.bahramsilk.com`; set `www` to redirect
   (308) to the apex. Point DNS at Vercel as it instructs.
2. **Vercel → Environment Variables (Production):** `NEXT_PUBLIC_SITE_URL=https://bahramsilk.com`,
   then redeploy (the value is baked into the build).
3. **Check:** `https://bahramsilk.com/robots.txt` lists `Sitemap: https://bahramsilk.com/sitemap.xml`,
   and `/sitemap.xml` lists three child sitemaps whose URLs all start with `https://bahramsilk.com`.
4. **Google Search Console:** add a **Domain** property for `bahramsilk.com` and verify it with the
   DNS TXT record at your registrar. (A URL-prefix property can use the meta tag instead: set
   `GOOGLE_SITE_VERIFICATION` in Vercel and redeploy.)
5. **Search Console → Sitemaps:** submit `https://bahramsilk.com/sitemap.xml`.
6. **URL inspection → Request indexing** for `/`, `/sarees`, `/sarees/bhagalpuri-silk`,
   `/sarees/tussar-silk` and `/fabric`.
7. **Rich Results Test** (search.google.com/test/rich-results) on one product page and one
   collection: Product, Breadcrumb and Merchant listing should show no errors.
8. **Google Merchant Center:** create an account, verify the same domain, and enable free listings.
   Product structured data already includes price, availability, shipping and returns; this is
   what puts products in the Shopping tab and product grids for queries like "silk saree".
9. **Google Business Profile** for the Bhagalpur shop or workshop (for "silk shop in bhagalpur"),
   with the website link and photos.
10. **Bing Webmaster Tools:** import the site from Search Console (covers Bing and DuckDuckGo).

## After launch

- Weekly for the first two months: Search Console → Pages (anything "not indexed" that should be),
  Enhancements (Product, Breadcrumb, FAQ), and Performance (queries and positions).
- When the journal or pillar guides are published, add `"articles"` back to `SITEMAP_IDS` in
  `src/lib/seo/sitemap.ts` and remove `noindex` from those pages.
- Slug changes in the admin create 301 redirects automatically; never delete a live product URL.
