# Architecture

Bahram Silks is one Next.js 16 application that serves the storefront, the admin panel and a few
route handlers. Supabase holds all state. External services are called from the server only, except
Razorpay Checkout and analytics, which run in the shopper's browser.

> The kickoff brief's architecture caption mentions a Medusa backend; Medusa was dropped (see
> [ADR 0001](adr/0001-stack-nextjs-supabase-free-tier.md) and [kickoff notes](kickoff-notes.md)).
> This page is the current picture.

## System context

```mermaid
flowchart LR
  shopper(["Shopper<br/>mobile-first browser"])
  staff(["Staff<br/>owner, manager, catalogue,<br/>fulfilment, support, accountant"])

  subgraph vercel["Vercel (Hobby now, Pro before live sales)"]
    direction TB
    proxy["proxy.ts<br/>session refresh, optimistic admin redirect"]
    store["Storefront routes<br/>src/app/(store)<br/>Server Components, cached catalogue"]
    admin["Admin routes<br/>src/app/admin<br/>role-gated, Server Actions"]
    api["Route handlers<br/>/api/webhooks/razorpay<br/>/api/cron/nightly<br/>/api/cron/release-reservations<br/>/api/health"]
    cron["Vercel Cron<br/>daily 02:00 IST"]
  end

  subgraph supabase["Supabase (Free now, Pro before live sales)"]
    direction TB
    pg[("Postgres + RLS<br/>catalogue, orders, stock,<br/>reservations, price history,<br/>consent log, audit log")]
    auth["Auth<br/>email OTP (shoppers)<br/>staff roles"]
    storage["Storage<br/>product media (WebP)"]
    pgcron["pg_cron<br/>release reservations every minute,<br/>purge carts and logs"]
  end

  razorpay["Razorpay Checkout<br/>UPI first; test mode on Hobby"]
  couriers["Couriers<br/>manual booking, then Shiprocket API"]
  smtp["SMTP email<br/>Nodemailer via Brevo or Resend"]
  whatsapp["WhatsApp<br/>click-to-chat links,<br/>Business app"]
  analytics["GA4, Search Console,<br/>Microsoft Clarity"]
  gha["GitHub Actions<br/>CI, weekly encrypted pg_dump"]

  shopper --> store
  staff --> admin
  shopper -.->|checkout widget| razorpay
  shopper -.->|after consent| analytics
  shopper -.->|ask about this saree| whatsapp
  store --> proxy
  admin --> proxy
  store -- "cookie-less anon client (cached)" --> pg
  store -- "session client (Suspense)" --> pg
  admin -- "session client, RLS by role" --> pg
  store --> auth
  admin --> auth
  admin -- "uploads via sharp" --> storage
  store -- "next/image" --> storage
  razorpay -- "signed webhooks" --> api
  api -- "service role" --> pg
  cron --> api
  pgcron --> pg
  admin -- "create order, refund" --> razorpay
  admin -- "labels, tracking (later API)" --> couriers
  api -- "transactional email" --> smtp
  admin -- "transactional email" --> smtp
  gha -- "pg_dump (session pooler)" --> pg
```

### Responsibilities

| Part                           | Owns                                                                            | Notes                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Storefront (`src/app/(store)`) | Catalogue, product pages, cart, checkout, account, craft content                | Public reads are `"use cache"` + `cacheTag` with a cookie-less client ([ADR 0006](adr/0006-caching-and-rendering.md)) |
| Admin (`src/app/admin`)        | Every back-office module from the brief                                         | Staff roles from `STAFF_ROLES`; checks in the data layer, not only in `proxy.ts`                                      |
| Domain (`src/lib/domain`)      | Money, pricing, claims, order state machine, reservations rules                 | Pure functions, no I/O, unit-tested                                                                                   |
| Route handlers (`src/app/api`) | Razorpay webhook (source of truth for payment state), cron entry points, health | Cron endpoints require `Authorization: Bearer $CRON_SECRET`                                                           |
| Postgres                       | All state, constraints, reservation locking, RLS                                | Enums mirror `src/lib/domain/enums.ts` exactly                                                                        |
| pg_cron                        | Per-minute reservation expiry, housekeeping                                     | Primary scheduler; Vercel Cron is the daily backstop                                                                  |
| Storage                        | Product images and videos                                                       | No blobs in Postgres; public bucket, private bucket for invoices                                                      |

## Order lifecycle

Twelve states, exactly `ORDER_STATUSES` in `src/lib/domain/enums.ts`. Allowed transitions live in
`src/lib/domain/orders/state-machine.ts`; this diagram must match it. Every transition sends the
customer a message and creates an admin task.

```mermaid
stateDiagram-v2
  direction LR
  [*] --> pending_payment: prepaid checkout
  [*] --> awaiting_cod_confirmation: COD checkout

  pending_payment --> confirmed: payment captured (webhook)
  pending_payment --> cancelled: payment failed or abandoned

  awaiting_cod_confirmation --> confirmed: confirmed by WhatsApp or phone
  awaiting_cod_confirmation --> cancelled: not confirmed in time

  confirmed --> packed
  confirmed --> cancelled
  packed --> shipped
  packed --> cancelled

  shipped --> out_for_delivery
  shipped --> delivery_failed: NDR raised
  shipped --> delivered

  out_for_delivery --> delivered
  out_for_delivery --> delivery_failed: NDR raised

  delivery_failed --> out_for_delivery: reattempt
  delivery_failed --> rto: returned to origin

  delivered --> return_requested: within return window
  return_requested --> returned: pickup received, QC done
  return_requested --> delivered: request rejected or withdrawn

  cancelled --> [*]
  rto --> [*]: QC before restock
  returned --> [*]: refund, credit or exchange
  delivered --> [*]
```

Stock follows the order ([ADR 0003](adr/0003-one-of-a-kind-stock-reservations.md)): reserved at
checkout start, committed on `confirmed`, released on `cancelled`, and restocked from `rto` or
`returned` only after quality check (`returned_restock` adjustment) or written off
(`damaged_write_off`). Return requests have their own sub-workflow (`RETURN_STATUSES`: requested,
approved, pickup scheduled, received, QC, then refund to source, store credit or exchange).

## Environments

| Environment | App                                    | Database                    | Payments                                             |
| ----------- | -------------------------------------- | --------------------------- | ---------------------------------------------------- |
| Local       | `npm run dev` on http://localhost:3020 | Supabase CLI in Docker      | Razorpay test keys                                   |
| CI          | `next build` + `next start`            | Supabase CLI in the runner  | Placeholder test keys (smoke tests do not pay)       |
| Preview     | Vercel preview deploys                 | Staging Supabase project    | Razorpay test keys                                   |
| Production  | Vercel (Pro before live sales)         | Production Supabase project | Test keys until [going live](runbooks/going-live.md) |
