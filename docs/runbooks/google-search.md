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
   (308) to the apex. Point DNS at Vercel as it instructs. If the apex redirects to `www` instead,
   every canonical URL is a redirect: Google shows a grey globe instead of the favicon and reports
   pages as "Page with redirect". Check with `curl -I https://bahramsilk.com/` (expect 200).
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
9. **Google Business Profile** (business.google.com) for the Bhagalpur shop. This, not the
   website, is what ranks for "best silk in bhagalpur" and "silk shop in bhagalpur" (the map pack).
   - Name exactly "Bahram Raw Silk"; category "Silk store" (add "Textile mill" or "Saree shop").
   - Address exactly as on the site and GST record; website `https://bahramsilk.com`; phone.
   - Opening hours, 10+ real photos (shop front, looms, sarees), products, and a description that
     names tussar, matka, raw silk sarees and fabric.
   - Ask every happy customer for a Google review; reply to every review.
10. **Directory listings with the same name, address and phone (NAP):** IndiaMART, Justdial,
    TradeIndia and textileinfomedia (competitors in Bhagalpur searches are listed there), plus
    Instagram, Facebook and YouTube profiles linking to the site. Each one is a citation and a link.
11. **Bing Webmaster Tools:** import the site from Search Console (covers Bing and DuckDuckGo).

## After launch

- Weekly for the first two months: Search Console → Pages (anything "not indexed" that should be),
  Enhancements (Product, Breadcrumb, FAQ), and Performance (queries and positions).
- Pillar guides are CMS pages with slug `guides/<slug>` (Admin → Content). Once one is published,
  `/guides/<slug>` drops its "coming soon" noindex and joins `/sitemap/static.xml` on its own. The
  Bhagalpur silk guide is live; silk types, Silk Mark and saree care are next. When the journal is
  published, add `"articles"` back to `SITEMAP_IDS` in `src/lib/seo/sitemap.ts`.
- Slug changes in the admin create 301 redirects automatically; never delete a live product URL.
