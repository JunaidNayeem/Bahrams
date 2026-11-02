# Backlog: MVP and Phase 2

Source: [kickoff brief](kickoff.md). This turns the brief's MVP scope into epics and user stories with
acceptance criteria, prioritised with MoSCoW (**M**ust, **S**hould, **C**ould, **W**on't for MVP),
and maps them onto the 16-week roadmap.

- **K** in the Sprint column = scaffolded in the kickoff sprint (Sprint 0): the structure, types,
  config or schema exists; the feature is finished in the sprint shown after the slash.
- Story IDs are stable; reference them in branch names and PR titles (`feat/CHK-03-cod-rules`).
- Week numbers are relative to kickoff. Fix calendar dates once the target festival is agreed
  ([open questions](open-questions.md)).

## Roadmap

The brief's roadmap diagram is missing from the exported document ([kickoff notes](kickoff-notes.md)),
so this plan is reconstructed from its text: brand and certifications start on day one, build
overlaps design from week 5 and content from week 8, and the critical path is design sign-off in
week 6.

| Workstream             | W1–2                                                                     | W3–4                       | W5–6                                   | W7–8                           | W9–10                       | W11–12                 | W13–14                   | W15                             | W16           |
| ---------------------- | ------------------------------------------------------------------------ | -------------------------- | -------------------------------------- | ------------------------------ | --------------------------- | ---------------------- | ------------------------ | ------------------------------- | ------------- |
| Brand & certifications | Trademark search, Silk Mark + Handloom Mark applications, domain/handles | Logo concepts → choice     | Logo suite, guidelines                 | Packaging, tags, labels        | Print runs                  | Labels on stock        |                          | Certificates in hand for badges |               |
| Design                 | Discovery, IA, wireframes                                                | Design system, key screens | Storefront + admin screens, **Gate 1** | Part-time support              | Part-time                   |                        |                          |                                 |               |
| Build                  | **Sprint 0** foundations                                                 | (tech spikes)              | Sprint 1                               | Sprint 2                       | Sprint 3                    | Sprint 4               | Sprint 5                 | Sprint 6 hardening              | Launch fixes  |
| Content & SEO          |                                                                          |                            | Keyword map (writer from W6)           | Collection copy, shoot batch 1 | Pillar guides, product copy | Shoot batch 2, journal | **Gate 2** content ready | Final proofing                  |               |
| Operations             | Policies drafted                                                         | Courier and COD terms      | Packaging suppliers                    | Returns process, SOPs          | Staff hired or assigned     | Admin training         | Mock orders              | **Gate 3** launch readiness     | Go live       |
| Launch                 |                                                                          |                            |                                        | Waitlist page live             | Influencer shortlist        | Launch film shoot      | Seeding wave             | Soft launch                     | Public launch |

### Gates

| Gate                                   | When           | Passes when                                                                                                                                                                                                                            |
| -------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Design sign-off** (critical path) | End of week 6  | Logo chosen; design tokens final; home, collection, product, cart, checkout, account and the main admin screens approved at mobile and desktop widths; accessibility (contrast on gold) checked                                        |
| **2. Content ready**                   | End of week 14 | Every launch product has photos (flat, draped, pallu, border, model), unique copy, composition, care, HSN; every collection has 150–300 words + 4–6 FAQs; four pillar guides published; legal pages approved by lawyer                 |
| **3. Launch readiness**                | Week 15        | [Compliance checklist](compliance-checklist.md) complete; Core Web Vitals targets met on a mid-range Android; end-to-end order, COD, return and refund rehearsed; [going-live runbook](runbooks/going-live.md) complete; staff trained |

### Build sprints

| Sprint | Weeks | Goal                                                                                         |
| ------ | ----- | -------------------------------------------------------------------------------------------- |
| 0      | 1–2   | Foundations: repo, CI, Supabase schema skeleton, enums, design tokens, URL map, ADRs, docs   |
| 1      | 5–6   | Design system components, layouts, staff auth and roles, product and media admin             |
| 2      | 7–8   | Storefront catalogue: collections, filters, product pages, search, SEO and JSON-LD, sitemaps |
| 3      | 9–10  | Cart, checkout, reservations, Razorpay (test mode), COD rules, order emails                  |
| 4      | 11–12 | Admin orders, shipping (manual), returns, inventory, invoices, customers                     |
| 5      | 13–14 | CMS, journal, promotions, reviews, reports and GST, DPDP and grievance flows                 |
| 6      | 15    | Hardening: performance, accessibility and dark-pattern audits, security review, UAT          |

## MVP epics

### PLT: Platform foundations

| ID     | Story                                                                     | Acceptance criteria                                                                                                                | MoSCoW | Sprint |
| ------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| PLT-01 | As an engineer I can run the whole stack locally with one set of commands | `npm ci`, `npx supabase start`, `npm run db:reset`, `npm run dev` give a working site on :3020 with seed data; README documents it | M      | K / 0  |
| PLT-02 | As an engineer every PR is checked automatically                          | CI runs prettier, lint, typecheck, Vitest, DB reset, build and mobile smoke e2e; failures upload the Playwright report             | M      | K / 0  |
| PLT-03 | As the owner I have a weekly off-site backup                              | Encrypted `pg_dump` artifact weekly with 90-day retention; restore rehearsed once before launch                                    | M      | K / 6  |
| PLT-04 | As a shopper I am protected by sane security defaults                     | CSP, HSTS, nosniff, frame-ancestors none, Referrer-Policy, Permissions-Policy on every response; no `X-Powered-By`                 | M      | K / 0  |
| PLT-05 | As an engineer, enums and money rules have one source of truth            | `src/lib/domain/enums.ts` mirrored by Postgres enums; money helpers in paise with unit tests                                       | M      | K / 1  |
| PLT-06 | As an operator I can see the app is up                                    | `/api/health` returns `{status:"ok"}` uncached; external uptime monitor configured                                                 | S      | K / 6  |

### DS: Brand and design system

| ID    | Story                                                               | Acceptance criteria                                                                                                                              | MoSCoW | Sprint |
| ----- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------ |
| DS-01 | As a designer my tokens drive both store and admin                  | Colours (tussar gold, madder red, ivory; indigo, leaf green, charcoal), type and spacing as Tailwind `@theme` tokens; `/styleguide` renders them | M      | K / 1  |
| DS-02 | As a shopper with low vision I can read every price and label       | WCAG 2.2 AA contrast incl. gold text; focus visible; tested with axe in CI                                                                       | M      | 1      |
| DS-03 | As an engineer I build screens from shared primitives               | Button, input, select, checkbox, drawer, dialog, badge, price, rating, card, tabs, toast, table                                                  | M      | 1      |
| DS-04 | As the brand owner the site shows the chosen logo suite             | Wordmark, monogram, favicon, app icon wired once Gate 1 picks a concept                                                                          | M      | 1–2    |
| DS-05 | As a shopper I see Bhagalpuri stripes as borders, never behind text | Stripe border and zari divider components; lint/review rule                                                                                      | S      | K / 1  |

### CAT: Catalogue administration

| ID     | Story                                                | Acceptance criteria                                                                                                                                                        | MoSCoW | Sprint |
| ------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| CAT-01 | As a catalogue editor I create a saree with variants | Title, slug, kind, fibre (warp/weft), weave, zari, length (5.5 m + blouse), weight, care, HSN and GST rate defaults, colour and blouse variants; draft/scheduled/published | M      | K / 1  |
| CAT-02 | As a catalogue editor I list fabric sold per metre   | Price per metre in paise, 0.5 m step, min/max metres, swatch add-on, bulk price tiers                                                                                      | M      | 1      |
| CAT-03 | As a catalogue editor I upload photos and video      | Drag-drop upload, converted to WebP in 2–3 sizes with sharp, alt text required, reorder, 10–20 s video                                                                     | M      | 1      |
| CAT-04 | As a catalogue editor I fill SEO fields              | Editable SEO title, meta description, slug, OG image; slug change creates a 301                                                                                            | M      | 2      |
| CAT-05 | As a manager I import and export products in bulk    | CSV import with validation report and dry run; CSV export                                                                                                                  | S      | 4      |
| CAT-06 | As a catalogue editor I manage collections           | Manual and rule-based (fibre, occasion, price band) collections with intro copy and FAQs                                                                                   | M      | 2      |
| CAT-07 | As a manager I schedule a price change               | Price change writes `price_history`; scheduled sale prices; compare-at only if validated                                                                                   | M      | 2      |

### AUTH: Authenticity records

| ID      | Story                                                                  | Acceptance criteria                                                                                   | MoSCoW | Sprint |
| ------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------ | ------ |
| AUTH-01 | As a catalogue editor I record the Silk Mark label number per piece    | Field per piece; badge and verification link appear only when present                                 | M      | 2      |
| AUTH-02 | As a catalogue editor I record the Handloom Mark label and weaver/loom | Weaver and loom records; "Handloom" badge only with a valid label                                     | M      | 2      |
| AUTH-03 | As a manager I flag GI eligibility with evidence                       | `gi_eligible` + evidence note; "Bhagalpur Silk (GI)" wording only when set, else "woven in Bhagalpur" | M      | 2      |
| AUTH-04 | As an auditor I can see which label went on which piece                | Append-only label-usage log, exportable                                                               | S      | 4      |
| AUTH-05 | As a connoisseur I read the weaver's story                             | Weaver profile pages `/weavers/[slug]` (with consent), credited on product pages                      | S      | 5      |

### STORE: Storefront browsing

| ID       | Story                                                          | Acceptance criteria                                                                                                                                                             | MoSCoW | Sprint |
| -------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| STORE-01 | As a shopper I navigate by product, fabric, occasion and price | Mega-menu and mobile drawer follow the brief's IA; tussar and matka first; every entry is a crawlable link                                                                      | M      | K / 2  |
| STORE-02 | As a shopper I see proof on the home page                      | Hero, campaign, shop-by-fabric tiles, "Why Bahram" proof strip, bestsellers, reviews                                                                                            | M      | 2      |
| STORE-03 | As a shopper I filter and sort a collection                    | Filters: fabric, colour, occasion, price, weave, zari, blouse included; sort; 2-column mobile grid; SEO intro and FAQ; canonical/noindex per ADR 0007                           | M      | 2      |
| STORE-04 | As a shopper I trust a product page                            | 6–8 photos + video, zoom, composition, length, weight, care, label numbers, weaver credit, delivery estimate by PIN, COD availability, WhatsApp "ask about this saree", reviews | M      | 2      |
| STORE-05 | As a fabric buyer I order by the metre                         | Quantity stepper in 0.5 m steps; price updates; swatch add-on; bulk tiers shown                                                                                                 | M      | 2      |
| STORE-06 | As a shopper I see what is really in stock                     | One-of-a-kind pieces show "in someone's checkout" while reserved; sold pieces show sold, not hidden                                                                             | M      | 3      |
| STORE-07 | As a shopper I save pieces                                     | Wishlist for signed-in users                                                                                                                                                    | S      | 5      |
| STORE-08 | As a reader I learn the craft                                  | Our story, weavers, four pillar guides, journal (MDX) with Article JSON-LD                                                                                                      | M      | 5      |

### SRCH: Search

| ID      | Story                                       | Acceptance criteria                                                   | MoSCoW | Sprint |
| ------- | ------------------------------------------- | --------------------------------------------------------------------- | ------ | ------ |
| SRCH-01 | As a shopper I search with typos            | Postgres full-text + `pg_trgm`; "tusar" finds tussar; results noindex | M      | 2      |
| SRCH-02 | As a shopper I get suggestions while typing | Debounced suggestions, keyboard accessible                            | C      | 5      |

### SEO: Technical SEO

| ID     | Story                                            | Acceptance criteria                                                                                                                                                                      | MoSCoW | Sprint |
| ------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| SEO-01 | As Google I can crawl every landing page         | Server-rendered; clean URLs per ADR 0007; `robots.txt`; sitemaps split by products, collections, articles; updated on publish                                                            | M      | K / 2  |
| SEO-02 | As Google I understand every template            | JSON-LD per template (Organization, WebSite, BreadcrumbList, Product/ProductGroup with Offer, shippingDetails, hasMerchantReturnPolicy, Article, FAQPage) validated in Rich Results Test | M      | K / 2  |
| SEO-03 | As a manager I fix broken links                  | 301 redirect manager in the admin; automatic redirect on slug change                                                                                                                     | M      | 5      |
| SEO-04 | As a marketer I list products on Google Shopping | Merchant Center feed generated from the catalogue                                                                                                                                        | S      | 5      |

### CHK: Cart and checkout

| ID     | Story                                           | Acceptance criteria                                                                                                                        | MoSCoW | Sprint |
| ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------ |
| CHK-01 | As a guest I check out without an account       | Guest checkout; optional email OTP sign-in; cart persists across sessions                                                                  | M      | 3      |
| CHK-02 | As a shopper my address is quick to enter       | PIN code autofills city and state; serviceability checked                                                                                  | M      | 3      |
| CHK-03 | As a shopper I see the full price before paying | Line items, GST-inclusive prices, shipping, COD fee, gift wrap, discounts, total; no charge appears for the first time on the payment step | M      | 3      |
| CHK-04 | As a gift buyer I add wrap and a message        | Gift wrap is opt-in (never pre-ticked), priced upfront                                                                                     | S      | 3      |
| CHK-05 | As a shopper I apply a coupon                   | Coupon field; clear error messages; one coupon per order in MVP                                                                            | M      | 5      |
| CHK-06 | As a shopper I see my confirmation              | `/checkout/confirmation/[orderNumber]` with order summary and next steps                                                                   | M      | 3      |

### PAY: Payments and COD

| ID     | Story                                           | Acceptance criteria                                                                                                                       | MoSCoW | Sprint  |
| ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| PAY-01 | As a shopper I pay by UPI first                 | Razorpay Checkout with UPI first, then cards, netbanking, wallets, EMI; test mode only on Hobby                                           | M      | 3       |
| PAY-02 | As the business payment state is never guessed  | Signed webhook is the source of truth; idempotent; order confirmed only on capture                                                        | M      | 3       |
| PAY-03 | As the business COD is limited                  | COD only up to the order-value limit (default ₹5,000) and on serviceable PINs; fee shown on product, cart and checkout                    | M      | 3       |
| PAY-04 | As support I confirm COD orders                 | COD orders wait in `awaiting_cod_confirmation`; WhatsApp click-to-chat confirmation with prepaid link; auto-cancel when the window lapses | M      | 3       |
| PAY-05 | As a shopper I get a visible prepaid incentive  | Prepaid discount or free shipping as a visible line                                                                                       | S      | 3       |
| PAY-06 | As an accountant I refund to source             | Full and partial refunds via Razorpay from the admin; COD refunds by bank transfer recorded                                               | M      | 4       |
| PAY-07 | As an accountant I reconcile settlements        | Daily reconciliation of Razorpay settlements and courier COD remittances against orders                                                   | S      | 5       |
| PAY-08 | As a high-value COD buyer I pay a token upfront | Partial COD                                                                                                                               | W      | Phase 2 |

### INV: Inventory and reservations

| ID     | Story                                       | Acceptance criteria                                                                                                                      | MoSCoW | Sprint |
| ------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| INV-01 | As the business a piece is never sold twice | Reserve at checkout start, 15-minute TTL via pg_cron, commit on capture/COD confirmation (ADR 0003); concurrency test proves no oversell | M      | K / 3  |
| INV-02 | As fulfilment I see stock per location      | Shop, warehouse, with weaver; fabric in metres                                                                                           | M      | 4      |
| INV-03 | As fulfilment I adjust stock with a reason  | Reasons from `STOCK_ADJUSTMENT_REASONS`; audit trail                                                                                     | M      | 4      |
| INV-04 | As a manager I am alerted to low stock      | Threshold per SKU; dashboard and email alert                                                                                             | S      | 4      |
| INV-05 | As a manager I run a daily stock audit      | Printable count sheet; variance report                                                                                                   | C      | 6      |

### ORD: Orders and shipping

| ID     | Story                                                       | Acceptance criteria                                                                                 | MoSCoW | Sprint       |
| ------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ | ------------ |
| ORD-01 | As fulfilment I move orders through the 12-state lifecycle  | Only transitions in the state machine are allowed; each sends a customer message and creates a task | M      | K / 4        |
| ORD-02 | As support I add notes and take phone orders                | Internal notes; manual order creation with payment link or COD                                      | M      | 4            |
| ORD-03 | As an accountant I issue GST invoices and credit notes      | Sequential invoice numbers per financial year; CGST/SGST or IGST; HSN; PDF                          | M      | 4            |
| ORD-04 | As fulfilment I book shipments manually                     | Record courier, AWB, tracking URL; packing slip and label templates                                 | M      | 4            |
| ORD-05 | As fulfilment I handle failed deliveries                    | NDR → WhatsApp reattempt prompt → `out_for_delivery` or `rto`; RTO QC before restock                | M      | 4            |
| ORD-06 | As a shopper I track my order                               | `/track-order` by order number + email/phone; `/account/orders/[orderNumber]`                       | M      | 4            |
| ORD-07 | As fulfilment I split a shipment                            | Multiple shipments per order                                                                        | S      | 4            |
| ORD-08 | As fulfilment rates, labels and tracking sync automatically | Shiprocket API integration                                                                          | S      | after launch |

### RET: Returns and exchanges

| ID     | Story                                         | Acceptance criteria                                                                                                                                      | MoSCoW | Sprint |
| ------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| RET-01 | As a shopper I request a return within 7 days | Window from delivery; exclusions (custom-cut fabric, stitched-to-measure, final sale) stated before purchase; unboxing video requested for damage claims | M      | 4      |
| RET-02 | As support I process a return                 | Approve/reject, reverse pickup, QC, then exchange, store credit or refund to source; restock or write-off                                                | M      | 4      |

### ACC: Customer accounts

| ID     | Story                                      | Acceptance criteria                                                                                            | MoSCoW | Sprint  |
| ------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| ACC-01 | As a shopper I sign in with an email code  | Supabase email OTP; no passwords                                                                               | M      | K / 3   |
| ACC-02 | As a shopper I manage orders and addresses | Order history, tracking, returns, saved addresses                                                              | M      | 4       |
| ACC-03 | As a shopper I control my data             | `/account/privacy`: consents per purpose, withdraw in one click, download data, request correction or deletion | M      | 5       |
| ACC-04 | As a repeat buyer I earn points            | Loyalty points                                                                                                 | W      | Phase 2 |

### CRM: Customers (admin)

| ID     | Story                                 | Acceptance criteria                                                                 | MoSCoW | Sprint |
| ------ | ------------------------------------- | ----------------------------------------------------------------------------------- | ------ | ------ |
| CRM-01 | As support I see a customer's history | Profile, orders, addresses, tags (VIP, boutique, wholesale), notes, consent records | M      | 4      |

### CMS: Content

| ID     | Story                                  | Acceptance criteria                                                           | MoSCoW | Sprint |
| ------ | -------------------------------------- | ----------------------------------------------------------------------------- | ------ | ------ |
| CMS-01 | As a marketer I edit the home page     | Sections, banners, announcement bar, navigation menus, scheduled              | M      | 5      |
| CMS-02 | As a marketer I publish static pages   | Help and legal pages editable, versioned, linked in footer and checkout       | M      | 5      |
| CMS-03 | As a writer I publish journal articles | MDX files in the repo with frontmatter; Article JSON-LD; listed at `/journal` | M      | K / 5  |
| CMS-04 | As a marketer I build lookbooks        | Lookbook pages from products                                                  | C      | 5      |

### PRM: Promotions

| ID     | Story                                       | Acceptance criteria                                                                   | MoSCoW | Sprint  |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------------------- | ------ | ------- |
| PRM-01 | As a marketer I create coupons              | Percentage, flat, free shipping; validity dates; usage limits; min order              | M      | 5       |
| PRM-02 | As a marketer I schedule a festive sale     | Automatic offers with real start/end dates; prior price validated; no fake countdowns | S      | 5       |
| PRM-03 | As a marketer I sell bundles and gift cards | Bundle pricing; gift cards                                                            | W      | Phase 2 |

### REV: Reviews

| ID     | Story                           | Acceptance criteria                                                               | MoSCoW | Sprint |
| ------ | ------------------------------- | --------------------------------------------------------------------------------- | ------ | ------ |
| REV-01 | As a buyer I review with photos | Verified-purchase reviews with photos; request email after delivery               | M      | 5      |
| REV-02 | As support I moderate reviews   | Approve/reject (not by rating), reply; AggregateRating only from approved reviews | M      | 5      |

### RPT: Reports and dashboard

| ID     | Story                                | Acceptance criteria                                                                                                        | MoSCoW | Sprint |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| RPT-01 | As the owner I see today at a glance | Today's orders, revenue, COD vs prepaid, pending shipments, low stock, returns awaiting action, top products, SLA breaches | M      | 5      |
| RPT-02 | As an accountant I export GST data   | B2C, B2B and HSN summary; GSTR-1-ready CSV                                                                                 | M      | 5      |
| RPT-03 | As a manager I see sales and returns | Sales by day, product, fabric, channel; returns; COD reconciliation; inventory valuation; abandoned carts                  | S      | 5      |

### CMP: Compliance

| ID     | Story                                          | Acceptance criteria                                                                                  | MoSCoW | Sprint |
| ------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------ | ------ |
| CMP-01 | As a shopper I can raise a grievance           | `/grievance` with officer details; ticket; acknowledge ≤ 48 h, resolve ≤ 1 month, tracked in admin   | M      | 5      |
| CMP-02 | As the business consent is provable            | Append-only consent log per purpose; analytics load only after consent                               | M      | K / 5  |
| CMP-03 | As staff I handle privacy requests             | `/admin/privacy-requests` with due dates; erasure anonymises personal data while keeping GST records | M      | 5      |
| CMP-04 | As the business we pass the dark-pattern audit | All 13 patterns checked ([compliance checklist](compliance-checklist.md)); report stored             | M      | 6      |

### ADM: Settings, roles and audit

| ID     | Story                                        | Acceptance criteria                                                                                                  | MoSCoW | Sprint |
| ------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| ADM-01 | As the owner I invite staff with roles       | Owner, manager, catalogue editor, fulfilment, support, accountant; RLS enforces role scope                           | M      | K / 1  |
| ADM-02 | As the owner every staff action is traceable | Audit log of create/update/delete and state changes with actor and diff                                              | M      | 1      |
| ADM-03 | As the owner staff sign-in is protected      | Two-factor login (TOTP) for staff                                                                                    | M      | 4      |
| ADM-04 | As the owner I change business settings      | Tax defaults, shipping zones and rates, COD limit and fee, reservation TTL, notification settings, grievance officer | M      | 3–5    |

### NTF: Notifications

| ID     | Story                                                      | Acceptance criteria                                                                 | MoSCoW | Sprint |
| ------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------ | ------ |
| NTF-01 | As a shopper I get order emails                            | Confirmation, shipped, delivered, return updates, review request; branded templates | M      | 3–4    |
| NTF-02 | As a shopper I can message on WhatsApp                     | Click-to-chat links with prefilled product or order context                         | M      | 2      |
| NTF-03 | As a shopper I get abandoned-cart and back-in-stock emails | Only with marketing consent; unsubscribe in one click                               | S      | 5      |

### LCH: Launch readiness

| ID     | Story                                                | Acceptance criteria                                                           | MoSCoW | Sprint |
| ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------- | ------ | ------ |
| LCH-01 | As a shopper on a mid-range Android the site is fast | p75 LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, product-page JS ≤ 150 KB compressed | M      | 6      |
| LCH-02 | As the owner analytics are live                      | GA4, Search Console, Clarity, consent-aware                                   | M      | 6      |
| LCH-03 | As the owner the go-live runbook is complete         | [runbooks/going-live.md](runbooks/going-live.md) checked off                  | M      | 6      |
| LCH-04 | As a marketer I collect a waitlist before launch     | Waitlist page with marketing consent                                          | S      | 4      |

## Non-build workstreams (tracked here, owned by the client and agency)

- **Brand & certifications:** trademark search and filing (classes 24, 25, 35); Silk Mark authorised
  user; Handloom Mark registration; domain and social handles; logo suite; brand guidelines;
  packaging, swing tags, woven labels; invoice, label and packing-slip templates; social and email
  templates; B2B lookbook PDF.
- **Content & SEO:** keyword validation in Semrush/Ahrefs; collection copy (150–300 words + FAQs);
  unique product copy; four pillar guides; monthly weaver story; digital PR.
- **Operations:** courier aggregator account; COD terms; packaging suppliers; returns SOP; daily stock
  audit; staff (operations lead, catalogue executive, support, part-time accountant); admin training.
- **Launch:** waitlist, founders' collection of numbered pieces, launch film, influencer seeding
  (10–20 micro-creators), launch 3–4 weeks before the target festival.

## Phase 2 (months 5–9 after launch)

| ID    | Item                                           | Notes                                                                                     |
| ----- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| P2-01 | Hindi storefront                               | `/hi/...` routes, `hreflang`, Devanagari type (Tiro Devanagari Hindi or Mukta)            |
| P2-02 | B2B and wholesale portal                       | Price lists, MOQs, quote requests, GSTIN capture, credit terms                            |
| P2-03 | Marketplace sync                               | Amazon (Silk Mark store) and Flipkart listings and stock; best pieces stay site-exclusive |
| P2-04 | Loyalty and referrals                          | Points, tiers, referral codes                                                             |
| P2-05 | International shipping and multi-currency      | USD/GBP pricing for diaspora buyers                                                       |
| P2-06 | Video-call shopping booked from the site       | Calendar slots, WhatsApp video                                                            |
| P2-07 | Lookbook and catalogue generator for boutiques | PDF from selected products                                                                |
| P2-08 | Advanced promotions                            | Bundles, gift cards, tiered offers                                                        |
| P2-09 | Advanced reports                               | Cohorts, repeat rate, channel attribution                                                 |
| P2-10 | Paid WhatsApp Business API                     | Automated COD confirmation and NDR messages                                               |
| P2-11 | Partial COD                                    | Token prepaid, balance on delivery for high-value pieces                                  |
