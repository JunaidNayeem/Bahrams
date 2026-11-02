# Runbook: local development

Everything runs on your machine: Next.js on port 3020 and a full Supabase stack (Postgres, Auth,
Storage, pg_cron, local email inbox) in Docker. You never need access to the hosted projects to
build features.

## Services and ports

| Service                  | URL                                                       | Notes                                                  |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------ |
| App (storefront + admin) | http://localhost:3020                                     | `npm run dev`                                          |
| Supabase API             | http://127.0.0.1:54321                                    | Use as `NEXT_PUBLIC_SUPABASE_URL`                      |
| Postgres                 | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | `psql` or any SQL client                               |
| Supabase Studio          | http://127.0.0.1:54323                                    | Tables, SQL editor, storage, auth users                |
| Email inbox (Mailpit)    | http://127.0.0.1:54324                                    | Every email the local stack sends, including OTP codes |

## Daily loop

```bash
npx supabase start        # if Docker was restarted; no-op when already running
npm run dev
```

Before you push:

```bash
npx prettier --check . && npm run lint && npm run typecheck && npm test
```

## Environment variables

`.env.example` lists every variable with a comment. Copy it to `.env.local` (never committed) and fill
the Supabase values from:

```bash
npx supabase status -o env \
  --override-name api.url=NEXT_PUBLIC_SUPABASE_URL \
  --override-name auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY
```

Use Razorpay **test** keys from the Razorpay dashboard (test mode) for checkout work. Live keys must
never be in `.env.local` ([ADR 0004](../adr/0004-payments-test-mode-and-hosting.md)).

## Signing in

- **Staff:** http://localhost:3020/admin/login with `owner@bahramsilks.local` (seeded with the `owner`
  role). Read the code from the inbox at http://127.0.0.1:54324.
- **Shopper:** http://localhost:3020/login with any address; the code also arrives in the local inbox.

## Database changes

1. Create a migration: `npx supabase migration new <short_name>` and write SQL in the new file under
   `supabase/migrations/`.
2. If you add or change an enum, change `src/lib/domain/enums.ts` in the same PR (same values, same
   order).
3. Apply from scratch: `npm run db:reset` (drops the local database, re-runs all migrations and
   `supabase/seed.sql`).
4. Regenerate types: `npm run db:types` and commit `src/lib/db/database.types.ts`.
5. Add or update pgTAP tests in `supabase/tests/` for RLS policies and stock functions; run them with
   `npx supabase test db`.

Never edit a migration that has been merged to `main`; write a new one.

## Testing

| What                               | Command                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| Unit tests (domain rules, helpers) | `npm test` or `npm run test:watch`                       |
| One test file                      | `npx vitest run src/lib/domain/pricing`                  |
| Database tests                     | `npx supabase test db`                                   |
| End-to-end                         | `npm run e2e` (see [e2e/README.md](../../e2e/README.md)) |

## Troubleshooting

| Symptom                                          | Fix                                                                                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx supabase start` says Docker is not running  | Start Docker Desktop (WSL 2 backend on Windows) and retry                                                                                          |
| Port 54321–54324 already in use                  | Another Supabase project is running: `npx supabase stop --all`                                                                                     |
| `Invalid API key` or 401 from Supabase           | Keys change when the local stack is recreated; re-copy them from `npx supabase status -o env`                                                      |
| Product images do not load in `next/image`       | `NEXT_PUBLIC_SUPABASE_URL` must point at `http://127.0.0.1:54321` so `next.config.ts` allows the local IP; restart `npm run dev` after editing env |
| No OTP email                                     | Open http://127.0.0.1:54324; local Supabase never sends real email                                                                                 |
| Type errors in `.next/types` after adding routes | `npm run typecheck` runs `next typegen` first; or restart `npm run dev`                                                                            |
| A `.md` file inside `src/app/` became a page     | `pageExtensions` includes `md`/`mdx`; keep notes outside `src/app/`                                                                                |
| Files show as fully changed on Windows           | `git config core.autocrlf false`, then `git add --renormalize .`                                                                                   |
| Data looks wrong after switching branches        | `npm run db:reset` to rebuild from that branch's migrations and seed                                                                               |
