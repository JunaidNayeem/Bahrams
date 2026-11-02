# End-to-end tests (Playwright)

Browser tests for journeys that cross the storefront, Supabase and Razorpay test mode. Pure business
rules are unit-tested with Vitest next to the code (`src/**/*.test.ts`); only put a test here when it
needs a real browser, real routing or a real database.

## Running

```bash
npx playwright install chromium          # once per machine
npx supabase start                       # local Postgres/Auth/Storage (Docker)
npm run e2e                              # both projects; starts `npm run dev` or reuses it
npx playwright test --project=mobile-chrome          # what CI runs
npx playwright test e2e/smoke.spec.ts --ui           # debug interactively
npx playwright show-report                           # last HTML report
```

- Base URL is `http://localhost:3020`. Set `PLAYWRIGHT_BASE_URL` to run against a deployed preview
  instead (no local server is started).
- In CI (`CI=true`) the config serves the production build with `npm run start`; build first.

## Projects

| Project          | Device         | Why                                                            |
| ---------------- | -------------- | -------------------------------------------------------------- |
| `mobile-chrome`  | Pixel 7        | Primary audience shops on Android phones; runs first and in CI |
| `desktop-chrome` | Desktop Chrome | Admin panel and desktop storefront layouts                     |

## Conventions

- File per journey: `smoke.spec.ts`, `catalogue.spec.ts`, `checkout.spec.ts`, `admin-orders.spec.ts`.
- Select by role and accessible name (`getByRole("link", { name: /bahram silks/i })`), never by CSS
  class. If a test cannot find an element by role, that is usually an accessibility bug to fix.
- Data comes from `supabase/seed.sql`; reset with `npm run db:reset` before a full run. Tests that
  buy a one-of-a-kind piece must create their own product or reset afterwards, because the seeded
  quantity-1 piece can be sold only once.
- Payments use Razorpay **test mode** only (test cards/UPI IDs from Razorpay's docs). Never put live
  keys in a test environment.
- Pending journeys are `test.fixme(...)` with a `TODO(sprint: …)` comment so they show as skipped in
  the report until the sprint that builds them.

## Contracts the smoke test relies on

- `GET /api/health` returns `{ "status": "ok", "time": <ISO string> }` with `Cache-Control: no-store`.
- The home page has exactly one `<h1>` and a header link whose accessible name is "Bahram Silks".
- `/styleguide` renders an `<h1>`.
- `/robots.txt` lists the sitemap and disallows `/admin`; `/sitemap.xml` is a sitemap or sitemap index.
- Security headers from `next.config.ts` are present on every page; `/admin/*` sends `X-Robots-Tag: noindex`.
