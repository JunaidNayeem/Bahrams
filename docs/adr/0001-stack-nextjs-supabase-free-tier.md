# 0001. One Next.js app on Vercel with Supabase, on free tiers

- Status: accepted
- Date: 2026-10-31
- Deciders: tech lead, client operations owner
- Source: [kickoff brief](../kickoff.md), "Technical architecture & stack"

## Context and problem statement

Bahram Silks needs a storefront and a full admin panel (catalogue, authenticity records, inventory,
orders, shipping, returns, CMS, promotions, reviews, reports, staff roles) in about 16 weeks, built
on open-source libraries with no monthly hosting cost until live sales start. Which platform gives
us all of that with the fewest moving parts?

## Decision drivers

- No monthly cost before launch; costs only once real orders flow.
- One codebase and one deploy for storefront and admin, so a two-person team can own it.
- Server rendering and structured data for SEO from sprint one.
- Strong data integrity for one-of-a-kind stock (transactions, row locks, constraints).
- Indian payments (UPI first) and pan-India couriers.

## Considered options

1. **Next.js (App Router) on Vercel + Supabase** (Postgres with RLS, Auth, Storage, pg_cron).
2. **Medusa** (headless commerce server) + Next.js storefront.
3. **Hosted SaaS** (Shopify or similar).

## Decision outcome

Chosen: **option 1**. Storefront and `/admin` live in one Next.js 16 app; Supabase provides the
database, auth, file storage and scheduled jobs. Libraries: Tailwind CSS, Radix primitives,
TanStack Table, React Hook Form + Zod, Recharts, Tiptap, Nodemailer, Razorpay Checkout.

**Why not Medusa.** Medusa needs an always-on Node server plus Redis. No free tier covers both
reliably, and it would add a second deploy and a second data model to keep in step with the CMS
and authenticity records we need anyway. Its features we would use (cart, orders, promotions) are a
small part of our scope; the domain-specific parts (Silk Mark and Handloom Mark records, price
history for the prior-price rule, metre-based fabric stock, COD confirmation) we would build either
way.

**Why not Shopify.** Monthly plan plus apps, limited control over structured data and URL scheme
(`/collections/...`, `/products/...` only), and the authenticity and compliance records would live in
metafields and third-party apps.

### Consequences

- Good: ₹0 per month until launch; one repo, one deploy, one set of types generated from the database.
- Good: Postgres gives us transactions and row locks for reservations ([ADR 0003](0003-one-of-a-kind-stock-reservations.md)),
  full-text search with `pg_trgm` for typo tolerance (no Algolia or Meilisearch), and `pg_cron` for jobs.
- Bad: we write commerce logic (cart, checkout, order state machine, coupons) ourselves. Mitigated by
  keeping it in pure, unit-tested modules in `src/lib/domain/`.
- Bad: Vercel Hobby is non-commercial, which forces payments to stay in test mode
  ([ADR 0004](0004-payments-test-mode-and-hosting.md)).

## Free-tier limits and mitigations

| Limit                                              | Risk                                      | Mitigation in this codebase                                                                                                                                                          |
| -------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vercel Hobby is personal, non-commercial use only  | Taking real orders would breach the terms | Razorpay stays in test mode until Vercel Pro or a commercial-friendly host ([ADR 0004](0004-payments-test-mode-and-hosting.md))                                                      |
| Vercel Hobby cron runs at most once a day          | Cannot release reservations every minute  | Reservations are released by Supabase `pg_cron` every minute; the daily Vercel cron (`/api/cron/nightly`, `vercel.json`) is a backstop and runs housekeeping                         |
| Supabase Free pauses after 7 days without activity | Site goes down and wakes slowly           | Regular traffic, the daily cron and CI keep it active; upgrade to Pro before live sales                                                                                              |
| 500 MB database                                    | Fills with carts, sessions and logs       | No images or blobs in Postgres; `pg_cron` purges abandoned carts and expired reservations; log tables are pruned on a schedule                                                       |
| 1 GB storage, 5 GB egress                          | Product photos are the biggest consumer   | WebP on upload with `sharp` (~150 KB each, 6–8 per product ≈ 1 MB/product → ~800–900 products); `next/image` caches optimised variants for 31 days (`minimumCacheTTL`) to cut egress |
| No daily backups on Free                           | Data loss                                 | Weekly encrypted `pg_dump` via GitHub Actions (`.github/workflows/backup.yml`), 90-day retention                                                                                     |
| Two active free projects per organisation          | No room for many environments             | One project for production, one for staging; everyone develops against the local Supabase CLI stack                                                                                  |
| Vercel Hobby image optimisation quota              | Optimisation stops when exceeded          | Images are already WebP and sized on upload; if the quota is hit, serve the stored sizes directly with `unoptimized`                                                                 |

## More information

- Local development: [runbooks/local-dev.md](../runbooks/local-dev.md)
- Upgrade path: [runbooks/going-live.md](../runbooks/going-live.md)
