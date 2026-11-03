# Runbook: going live

The steps that turn the free-tier build into a shop that can legally take real money. Work through it
in order during Sprint 6 (week 15); Gate 3 (launch readiness) requires every box ticked. Record who
did each step and when.

Prerequisites from the client: legal entity, GSTIN, bank account, grievance officer, domain, budget
for paid hosting ([open questions](../open-questions.md)).

## 1. Domain and DNS

- [ ] Register or confirm `bahramsilk.com` (and `www.bahramsilk.com` redirecting to it). Enable registrar lock and 2FA.
- [ ] Add the domain to the Vercel project; apex and `www` (redirect `www` → apex or the reverse, pick
      one and keep it).
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://bahramsilk.com` in Vercel Production; redeploy so canonicals,
      sitemaps and JSON-LD use it.
- [ ] Check HTTPS and the HSTS header; once stable for a month, submit to the HSTS preload list.

## 2. Hosting: Vercel Pro

Vercel Hobby is non-commercial only ([ADR 0004](../adr/0004-payments-test-mode-and-hosting.md)).

- [ ] Upgrade the team to **Vercel Pro** (or move to a host whose terms allow commercial use; then
      port `vercel.json` crons and headers).
- [ ] Function region `bom1` (Mumbai), matching `vercel.json`, close to the Supabase region.
- [ ] Production environment variables set (Production scope only for secrets): Supabase URL and keys,
      Razorpay keys and webhook secret, `CRON_SECRET`, SMTP credentials, analytics IDs.
- [ ] Cron `/api/cron/nightly` visible under Settings → Cron Jobs and succeeding.
- [ ] Spend limit and usage alerts configured.

## 3. Database: Supabase Pro and backups

- [ ] Production project in region **ap-south-1 (Mumbai)**. Upgrade to **Supabase Pro**: no inactivity
      pause, daily backups, larger database, storage and egress.
- [ ] Migrations applied with `npx supabase db push` from `main` (never edit production schema by hand).
- [ ] Production seed: only reference data (settings, shipping zones, staff owner). No demo products.
- [ ] Auth: site URL and redirect URLs set to the production domain; email OTP template branded; custom
      SMTP configured (below); staff MFA enforced.
- [ ] Storage buckets and policies match migrations; public bucket only for product media.
- [ ] `pg_cron` jobs present (`select * from cron.job;`): reservation release every minute, purges.
- [ ] RLS enabled on every table (`select relname from pg_class where relkind = 'r' and not relrowsecurity` returns only system tables).

### Backups and restore

- [ ] GitHub repository is private. Environment `production` has secrets `SUPABASE_DB_URL` (Session
      pooler connection string, port 5432, IPv4) and `BACKUP_PASSPHRASE` (also in the owner's password
      manager).
- [ ] Run **Weekly database backup** manually (Actions → workflow_dispatch) and confirm the artifact.
- [ ] **Rehearse a restore** into a scratch project or local Postgres 17:

  ```bash
  sha256sum -c bahram-silks-<stamp>.dump.gpg.sha256              # integrity of the download
  gpg --decrypt bahram-silks-<stamp>.dump.gpg > backup.dump      # asks for BACKUP_PASSPHRASE
  pg_restore --no-owner --no-privileges --clean --if-exists \
    --dbname "<Session pooler URI of a scratch Supabase project>" backup.dump
  ```

  Restoring a full dump into a fresh Supabase project can conflict on Supabase-managed schemas
  (`auth`, `storage`); restore `public` first with `--schema=public`, then `auth.users` data if needed.

- [ ] Supabase Pro daily backups are the primary backup; the weekly GitHub dump is the off-site copy.

## 4. Payments: Razorpay live

- [ ] Razorpay KYC complete with the legal entity, GSTIN, bank account and website URL. Razorpay
      reviews the legal pages, so publish them first.
- [ ] Live keys added to Vercel **Production only**: `RAZORPAY_KEY_ID`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`,
      `RAZORPAY_KEY_SECRET`. Preview and development keep test keys.
- [ ] Live webhook `https://bahramsilk.com/api/webhooks/razorpay` with a new secret
      (`RAZORPAY_WEBHOOK_SECRET`), events: `payment.captured`, `payment.failed`, `order.paid`,
      `refund.processed`, `refund.failed`.
- [ ] Set `PAYMENTS_LIVE_ENABLED=true` in Production; the test-mode notice disappears.
- [ ] One real low-value order by UPI and one by card; refund both; reconcile against the settlement
      report in the admin.
- [ ] COD limit, COD fee and serviceable PIN list set in admin settings.

## 5. Email (SMTP)

- [ ] Provider chosen (Brevo or Resend free tier to start); sending domain verified with **SPF, DKIM and
      DMARC** records.
- [ ] SMTP credentials in Vercel Production and in Supabase Auth custom SMTP (so OTP emails come from
      the brand domain, not Supabase's rate-limited default sender).
- [ ] Send each template to a test inbox: OTP, order confirmation, shipped, delivered, return updates,
      review request, grievance acknowledgement.

## 6. Analytics and search

- [ ] **GA4** property and web stream; measurement ID in env; e-commerce events (view_item, add_to_cart,
      begin_checkout, purchase) verified in DebugView; loads only after analytics consent.
- [ ] **Google Search Console**: domain property verified by DNS; sitemaps submitted; Rich Results test
      passes for home, collection, product and article templates.
- [ ] **Microsoft Clarity** project; ID in env; masking enabled for all form fields; consent-gated.
- [ ] Bing Webmaster Tools: import from Search Console.
- [ ] Confirm the CSP in `next.config.ts` allows exactly these origins (no console CSP violations).

## 7. Google Merchant Center

- [ ] Account linked to the Search Console property; business details and logo.
- [ ] Shipping and return policies configured (matching `/legal/shipping-policy` and
      `/legal/returns-policy` and the `shippingDetails` / `hasMerchantReturnPolicy` JSON-LD).
- [ ] Product feed URL from the admin submitted; no disapprovals for price or availability mismatch.
- [ ] Free listings enabled; Performance Max only after 30+ conversions (brief).

## 8. Google Business Profile

- [ ] Profile for the Bhagalpur shop or workshop (if a public location exists; see open questions),
      verified; photos of the shop and looms; website link; hours; WhatsApp number.
- [ ] Review link added to the post-delivery email.

## 9. Final checks

- [ ] [Compliance checklist](../compliance-checklist.md) complete or waived by the owner.
- [ ] Core Web Vitals on a mid-range Android over 4G: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- [ ] `robots.txt` allows the storefront (no leftover staging `Disallow: /`); staging is noindex.
- [ ] Uptime monitor on `https://bahramsilk.com/api/health` alerting the tech lead and operations lead.
- [ ] Staff accounts created with the least role needed; seeded local accounts absent from production.
- [ ] Incident contacts written down: Vercel, Supabase, Razorpay support, courier account manager.
