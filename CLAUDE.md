@AGENTS.md

# Bahram Silks — storefront + admin

D2C e-commerce for Bahram Silks (Bhagalpur tussar, raw, matka silk sarees and fabric by the metre).
The product brief is [docs/kickoff.md](docs/kickoff.md); read the section relevant to your task before
building. Backlog and decisions live in `docs/`.

## Stack (decided — see docs/adr/)

- One Next.js 16 app (App Router, TypeScript strict, `cacheComponents: true`) for storefront AND `/admin`.
  Next 16 differs from older versions (e.g. `middleware.ts` is now `proxy.ts`, `params`/`searchParams`/
  `cookies()` are async, caching uses `"use cache"` + `cacheLife`/`cacheTag`). Check
  `node_modules/next/dist/docs/` before using an API you are unsure of.
- Supabase: Postgres + RLS, Auth (email OTP for shoppers; staff roles), Storage (product media).
  Local dev via `npx supabase start` (Docker). Migrations in `supabase/migrations/`, seed in `supabase/seed.sql`.
- Tailwind CSS v4 (tokens in `src/app/globals.css` via `@theme`), shadcn-style primitives on `radix-ui`.
- Forms: React Hook Form + Zod 4. Tables: TanStack Table. Charts: Recharts. Rich text: Tiptap.
- Payments: Razorpay **test mode only** until hosting moves off Vercel Hobby (non-commercial terms).
- Tests: Vitest (`*.test.ts` next to the code), Playwright (`e2e/`).
- npm (no pnpm/yarn on this machine).

## Layout

```
src/app/(store)/        storefront routes (shared header/footer layout)
src/app/admin/          admin panel (staff only, role-gated)
src/app/api/            route handlers (webhooks, cron)
src/components/ui/      design-system primitives (token-driven, shared by store and admin)
src/components/brand/   brand pieces (wordmark, zari divider, stripe border, proof strip)
src/components/store/   storefront-only components
src/components/admin/   admin-only components
src/lib/domain/         pure business rules, no I/O, fully unit-tested (enums.ts is the source of truth)
src/lib/seo/            JSON-LD builders, metadata helpers, indexability rules
src/lib/supabase/       server / browser / service-role clients, session refresh
src/lib/db/             generated database types (database.types.ts)
src/lib/data/           server-only data access, one file per area (catalog.ts, cart.ts, admin-orders.ts…)
supabase/               config, migrations, seed
docs/                   kickoff brief, ADRs, backlog, open questions
```

## Rules that come from the brief (do not break)

- **Money is integer paise** (`number`, never floats), INR. Displayed prices are GST-inclusive.
- **Claims need records.** "Pure Silk", "Silk Mark", "Handloom" and "GI" badges render only when the
  matching record exists (label number / GI-eligibility flag). Use `src/lib/domain/claims`.
- **Discounts need genuine price history.** A compare-at / "prior price" is shown only if
  `src/lib/domain/pricing` validates it against `price_history`. No fake timers, pre-ticked add-ons,
  hidden or drip charges (Dark Patterns Guidelines 2023; E-Commerce Amendment Rules from 1 Jan 2027).
- **One-of-a-kind stock.** Reserve at checkout start (not add-to-cart), auto-release after 15 min
  unpaid, commit on payment capture or COD confirmation. Never double-sell a quantity-1 piece.
- **COD** limited by order value (default ₹5,000) and serviceable PIN; COD fee shown upfront;
  COD orders sit in `awaiting_cod_confirmation` until confirmed.
- **DPDP:** separate opt-in per consent purpose, consent log is append-only, withdrawal as easy as
  granting, account deletion and access/correction requests supported.
- **Never store card data.** Refunds go to source by default.
- SEO from day one: server-rendered pages, clean URLs (`/sarees/tussar-silk`, `/fabric/matka-silk`),
  canonical on filtered/sorted views, `noindex` on thin filter combinations, JSON-LD on every template.
- Accessibility WCAG 2.2 AA; gold text must meet contrast; never put stripe patterns behind text.
- Use "Bhagalpur Silk (GI)" only for GI-eligible products; otherwise "woven in Bhagalpur". GI date is 2013.

## Commands

```
npm run dev            # next dev
npm run build          # next build
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm test               # vitest run
npm run e2e            # playwright
npx supabase start     # local Postgres/Auth/Storage in Docker
npx supabase db reset  # re-apply migrations + seed
npm run db:types       # regenerate src/lib/db/database.types.ts from local DB
```
