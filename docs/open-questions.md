# Open questions for the client

From the brief's "Open questions for the client", plus questions the kickoff sprint raised. Each has
the reason it blocks something and the default we build against until it is answered. Defaults are
deliberately easy to change (settings or content, not code) wherever possible.

When a question is answered: tick it, record the answer and date, update the default in code or
settings, and add a line to the relevant ADR if a decision changed.

## From the brief

- [ ] **Is the business the "Bahram Raw Silk" listed in Bhagalpur since 1948?**
  - Blocks: the founding year in copy, the "Heritage seal" logo concept (C) and the `/our-story` page.
  - Default: no founding year anywhere (`siteConfig.foundingYear = null`). **Logo concept C is on hold**;
    concepts A (cocoon monogram) and B (Ganga loom) proceed. Story copy avoids dates.
- [ ] **Legal entity name, GSTIN, registered address and grievance-officer details**
  - Blocks: footer seller identity, GST invoices, `/grievance`, Razorpay KYC, legal pages.
  - Default: placeholders marked `TODO(client)` in `src/config/site.ts` and the `settings` table;
    invoices cannot be issued in production until set.
- [ ] **Existing Silk Mark, Handloom Mark or India Handloom Brand registrations**
  - Blocks: which badges can show at launch; the label-number data entry plan.
  - Default: none held. Badges stay off until label numbers are entered ([ADR 0005](adr/0005-compliance-by-design.md)).
    Applications start in week 1.
- [ ] **Product mix at launch** (sarees only, or also fabric, stoles, dress material, menswear, home furnishing?)
  - Blocks: navigation, collection pages, data model priorities, photography plan.
  - Default: **sarees + fabric by the metre + stoles and dupattas**. Dress material, kurta fabric and
    home furnishing routes exist but stay out of the navigation and sitemap until they have products.
- [ ] **Number of SKUs at launch, and how many are one-of-a-kind**
  - Blocks: storage budget (~800–900 products fit the free tier), photography schedule, import plan.
  - Default: plan for ~150 launch products, most of them quantity 1.
- [ ] **Own looms, partner weavers or both? Will weavers be named on the site?**
  - Blocks: weaver records, `/weavers` pages, weaver credit on product pages.
  - Default: weaver records are optional per product; names are shown only with recorded consent.
- [ ] **Price range and margin targets per category**
  - Blocks: price-band landing pages, free-shipping threshold, prepaid incentive size.
  - Default: price bands from the brief (under ₹3,000; ₹3,000–₹7,000; above ₹7,000); free-shipping
    threshold unset until real average order value exists.
- [ ] **Target launch festival and hard deadline**
  - Blocks: calendar dates for the 16-week roadmap; launch campaign timing.
  - Default: relative weeks only ([backlog](backlog.md)); launch 3–4 weeks before the chosen festival.
- [ ] **Who will run operations, support and the admin day to day?**
  - Blocks: staff accounts and roles, training plan, COD confirmation SLA.
  - Default: the seeded local owner account only (`owner@bahramsilks.local`); roles from the brief.
- [ ] **Domain names and social handles already owned**
  - Blocks: production URL, email sender domain (SPF/DKIM), social links, Merchant Center.
  - Default: `bahramsilks.com` and the handles in `src/config/site.ts`, unverified.
- [ ] **Budget envelope and preference for in-house build vs agency**
  - Blocks: when to move from free tiers to Vercel Pro and Supabase Pro (required before live sales).
  - Default: free tiers through the build ([ADR 0001](adr/0001-stack-nextjs-supabase-free-tier.md)).
- [ ] **Retail outlet in Bhagalpur for local pickup and Google Business Profile?**
  - Blocks: store-pickup shipping option, LocalBusiness structured data, Google Business Profile.
  - Default: no pickup option; Organization structured data only.

## Raised during kickoff

- [ ] **Payments go-live and hosting**: when will the client fund Vercel Pro (or another commercial
      host) and Supabase Pro?
  - Blocks: taking real money.
  - Default: **Razorpay test mode** in every environment ([ADR 0004](adr/0004-payments-test-mode-and-hosting.md)).
- [ ] **COD limit and fee**
  - Default: COD up to **₹5,000** order value, nominal fee shown upfront (amount TODO(client)); editable in settings.
- [ ] **Return window and exclusions**
  - Default: **7 days from delivery**, unused with tags; exchange or store credit first, refund to
    source on request; custom-cut fabric, stitched-to-measure and final-sale items excluded.
- [ ] **Prior-price rule window** for compare-at prices
  - Default: the prior price was charged for an unbroken run of at least 7 days within the last 90
    days ([ADR 0002](adr/0002-money-tax-and-pricing.md)); confirm the window with the lawyer.
- [ ] **GST treatment** of linen fabric, stitched items, shipping and COD fees
  - Default: 5% for silk, cotton and linen fabric and sarees; charges taxed at the principal goods' rate; confirm with the CA.
- [ ] **Transactional email provider** (Brevo free tier or Resend free tier) and sender address
  - Default: local Supabase inbox in development; provider chosen before Sprint 3.
- [ ] **Reservation hold time**
  - Default: 15 minutes for prepaid checkout; 24-hour confirmation window for COD orders.
