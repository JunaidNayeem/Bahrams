# 0004. Razorpay in test mode while hosted on Vercel Hobby

- Status: accepted
- Date: 2026-10-31
- Source: [kickoff brief](../kickoff.md), "Free-tier limits and how the design copes" and "Payments and COD policy"

## Context and problem statement

The build runs on Vercel's free Hobby plan, which its fair-use guidelines restrict to personal,
non-commercial use. Taking real orders there would breach the terms. We still need a complete,
testable checkout from the first payment sprint. How do we build payments now without trading
illegally on the free host?

## Decision drivers

- Ship and test the full checkout (UPI first, cards, netbanking, wallets, EMI, COD) during the build.
- Do not breach Vercel Hobby terms.
- Switching to live must be configuration, not code.
- Never store card data; refunds go to source by default.

## Decision outcome

- **Razorpay Checkout in test mode only** while the app is on Vercel Hobby. Test keys
  (`rzp_test_…`) in every environment; live keys are never added to Vercel Hobby.
- The server refuses to start in production with a live key unless `PAYMENTS_LIVE_ENABLED=true` is
  set, and that flag is only set once the go-live checklist below is complete.
- Payment flow: the server creates a Razorpay order for the exact total in paise
  ([ADR 0002](0002-money-tax-and-pricing.md)); the browser opens Checkout; the result is verified
  server-side (signature check) and the **webhook** `/api/webhooks/razorpay` is the source of truth
  for capture, failure and refund events. Webhook handling is idempotent on the event id.
- Card data never touches our servers (Razorpay handles tokenisation under RBI rules).
- COD is a payment method of our own; no gateway involved. It is limited by order value (default
  ₹5,000) and serviceable PIN codes, and orders wait in `awaiting_cod_confirmation`.
- The storefront shows a site-wide notice on non-production hosts and during test mode, so nobody
  mistakes the build for a live shop.

### Consequences

- Good: the full payment code path, webhooks and refunds are exercised end to end with test cards
  and test UPI IDs, in CI and on preview deploys.
- Good: going live is a hosting upgrade plus key swap.
- Bad: no real revenue until the hosting decision is made; the client must budget Vercel Pro (or an
  alternative commercial host) and Supabase Pro before launch.

## Go-live checklist (payments and hosting)

Full steps are in [runbooks/going-live.md](../runbooks/going-live.md). In short:

1. Move hosting to **Vercel Pro** (or another host whose terms allow commercial use).
2. Upgrade Supabase to **Pro** (no inactivity pause, daily backups, more storage and egress).
3. Complete Razorpay KYC with the legal entity, GSTIN and bank account; activate live mode.
4. Add live keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) and a new `RAZORPAY_WEBHOOK_SECRET`
   as production-only environment variables.
5. Register the live webhook `https://<domain>/api/webhooks/razorpay` for `payment.captured`,
   `payment.failed`, `order.paid`, `refund.processed` and `refund.failed`.
6. Set `PAYMENTS_LIVE_ENABLED=true` in production only; remove the test-mode notice.
7. Place one low-value real order with UPI and one with a card (a test product priced at a few
   rupees), refund both, and reconcile them in the admin against the Razorpay settlement report.
8. Confirm the legal pages (terms, refunds, cancellation, grievance officer) are published, because
   Razorpay checks them during activation.

## More information

- Razorpay live pricing: 2% + GST per transaction, no fixed fee (kickoff brief).
- [ADR 0001](0001-stack-nextjs-supabase-free-tier.md) for the other free-tier limits.
