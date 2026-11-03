# Bahram Silks — storefront and admin

The online home of Bahram Silks, "the weaving house of Bhagalpur": a direct-to-consumer store for
Bhagalpur tussar, raw and matka silk sarees and fabric by the metre, plus the admin panel the
business runs on every day (catalogue, authenticity records, inventory, orders, shipping, returns,
content, reports).

One Next.js 16 app serves both the storefront and `/admin`, backed by Supabase (Postgres, Auth,
Storage, pg_cron) and Razorpay Checkout. Everything runs on free tiers until live sales start; see
[ADR 0001](docs/adr/0001-stack-nextjs-supabase-free-tier.md) and
[ADR 0004](docs/adr/0004-payments-test-mode-and-hosting.md).

The product brief is [docs/kickoff.md](docs/kickoff.md). Read the section for the area you are
working on before you build it.

## Prerequisites

| Tool    | Version | Notes                                                  |
| ------- | ------- | ------------------------------------------------------ |
| Node.js | 22 LTS  | Matches CI. `node -v` should print `v22.x`.            |
| npm     | 10+     | The project uses npm only (no pnpm or yarn).           |
| Git     | 2.40+   | Line endings are normalised to LF by `.gitattributes`. |

No Docker: the app, scripts and migrations all use the hosted Supabase project.

The Supabase CLI and Playwright are dev dependencies, so `npx supabase …` and `npx playwright …`
work without a global install.

### Windows notes

- Run `git config --global core.autocrlf false` before cloning; `.gitattributes` keeps files LF and
  Prettier checks for it.
- Command examples are written for Git Bash. In PowerShell, `cp` works as an alias of `Copy-Item`,
  and multi-line commands ending in `\` must be joined onto one line (or use a backtick).

## First run (hosted Supabase, no Docker)

The app talks to the hosted Supabase project `csduibahmolbagejicfq`, which already has the
migrations, demo data and sample photos loaded.

```bash
npm ci
cp .env.example .env.local            # fill in the keys and database URL (see comments in the file)
npm run dev                           # http://localhost:3020
```

Setting up a **new, empty** project instead: fill `.env.local` for it, then

```bash
npm run db:push -- --include-seed     # migrations + demo data (seed only into an empty project)
npm run db:media -- --allow-remote    # sample product images (demo projects only)
```

`db:push` with no flags applies new migrations only, so it is also how schema changes reach the
hosted project. `db:media` generates woven-texture placeholder images in each product's colours;
real photography replaces them through the admin media library.

Day-to-day details and troubleshooting: [docs/runbooks/local-dev.md](docs/runbooks/local-dev.md).

**Admin panel.** Open http://localhost:3020/admin and sign in with `owner@bahramsilks.local` (or
`fulfilment@bahramsilks.local` to see a restricted role), password `bahram-local-dev`. The seed
includes ~40 demo orders, customers, a grievance and a privacy request so every screen has data.
For a client walkthrough, follow [docs/demo-script.md](docs/demo-script.md).

Database, auth users and storage are browsable in the Supabase dashboard (Table editor, Auth,
Storage). The Free plan pauses a project after 7 days without traffic; open the site the day before
a demo.

## Scripts

| Script               | What it does                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Next.js dev server (Turbopack) on port 3020                                                         |
| `npm run build`      | Production build                                                                                    |
| `npm run start`      | Serve the production build on port 3020                                                             |
| `npm run lint`       | ESLint                                                                                              |
| `npm run typecheck`  | Generate route types (`next typegen`) and run `tsc --noEmit`                                        |
| `npm test`           | Vitest unit tests, once                                                                             |
| `npm run test:watch` | Vitest in watch mode                                                                                |
| `npm run e2e`        | Playwright end-to-end tests (see [e2e/README.md](e2e/README.md))                                    |
| `npm run format`     | Prettier, writing changes                                                                           |
| `npm run db:push`    | Apply pending migrations to `SUPABASE_DB_URL` (`-- --include-seed`, `-- --dry-run`)                 |
| `npm run db:types`   | Regenerate `src/lib/db/database.types.ts` from the hosted project (needs `npx supabase login` once) |
| `npm run db:media`   | Upload sample product images (`-- --allow-remote` for a hosted demo project)                        |

Before pushing: `npm run lint && npm run typecheck && npm test && npx prettier --check .`

## Project layout

```
src/app/(store)/        storefront routes (shared header and footer)
src/app/admin/          admin panel (staff only, role-gated)
src/app/api/            route handlers: health, Razorpay webhook, cron
src/components/ui/      design-system primitives shared by store and admin
src/components/brand/   wordmark, zari divider, stripe border, proof strip
src/components/store/   storefront-only components
src/components/admin/   admin-only components
src/config/site.ts      brand and business constants
src/lib/domain/         pure business rules (money, pricing, claims, orders); unit-tested
src/lib/seo/            JSON-LD builders, metadata helpers, indexability rules
src/lib/supabase/       server, browser, public (cookie-less) and service-role clients
src/lib/data/           server-only data access, one file per area
supabase/               config, migrations, seed, pgTAP tests
e2e/                    Playwright tests
docs/                   brief, ADRs, backlog, runbooks, checklists
mdx-components.tsx      typography for MDX journal articles and guides
next.config.ts          security headers, CSP, images, MDX
```

`pageExtensions` includes `md` and `mdx`, so any Markdown file inside `src/app/` becomes a route.
Keep READMEs and notes out of `src/app/`.

## Documentation

- [Architecture](docs/architecture.md): system diagram and the order lifecycle
- [Decisions (ADRs)](docs/adr/): stack, money and tax, stock reservations, payments and hosting,
  compliance, caching, URLs and SEO
- [Backlog](docs/backlog.md): MVP epics and stories mapped to the 16-week roadmap
- [Open questions](docs/open-questions.md): what we need from the client and the defaults we assumed
- [Compliance checklist](docs/compliance-checklist.md): pre-launch legal and dark-pattern checks
- [Kickoff notes](docs/kickoff-notes.md): inconsistencies found in the brief and how we resolved them
- Runbooks: [local development](docs/runbooks/local-dev.md), [going live](docs/runbooks/going-live.md),
  [publishing on Google](docs/runbooks/google-search.md)

## Rules that are easy to break

Money is integer paise. Badges such as "Pure Silk", "Handloom" and "GI" render only when the
matching record exists. Compare-at prices need genuine price history. Stock is reserved at checkout,
not at add-to-cart. Payments stay in Razorpay test mode while hosted on Vercel Hobby. The full list
is in [CLAUDE.md](CLAUDE.md).
