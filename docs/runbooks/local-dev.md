# Runbook: development

Next.js runs on your machine (port 3020) against the hosted Supabase demo project
`csduibahmolbagejicfq` (Postgres, Auth, Storage, pg_cron). No Docker is needed.

## Services

| Service                  | Where                                                       | Notes                                   |
| ------------------------ | ----------------------------------------------------------- | --------------------------------------- |
| App (storefront + admin) | http://localhost:3020                                       | `npm run dev`                           |
| Supabase API             | https://csduibahmolbagejicfq.supabase.co                    | `NEXT_PUBLIC_SUPABASE_URL`              |
| Supabase dashboard       | https://supabase.com/dashboard/project/csduibahmolbagejicfq | Tables, SQL editor, storage, auth users |

## Daily loop

```bash
npm run dev
```

Before you push:

```bash
npx prettier --check . && npm run lint && npm run typecheck && npm test
```

## Environment variables

`.env.example` lists every variable with a comment. Copy it to `.env.local` (never committed) and fill
the Supabase values from the dashboard: Project Settings → API keys (publishable and secret keys) and
Connect (database URI; percent-encode special characters in the password).

Use Razorpay **test** keys from the Razorpay dashboard (test mode) for checkout work. Live keys must
never be in `.env.local` ([ADR 0004](../adr/0004-payments-test-mode-and-hosting.md)).

## Signing in

- **Staff:** http://localhost:3020/admin/login with `owner@bahramsilks.local` or
  `fulfilment@bahramsilks.local`, password `bahram-local-dev` (seeded demo accounts).
- **Shopper:** OTP sign-in is not built yet. When it is, Supabase sends the code by email; its default
  mailer is rate-limited, so configure SMTP in the dashboard before testing at volume.

## Database changes

1. Create a migration: `npx supabase migration new <short_name>` and write SQL in the new file under
   `supabase/migrations/`.
2. If you add or change an enum, change `src/lib/domain/enums.ts` in the same PR (same values, same
   order).
3. Check, then apply: `npm run db:push -- --dry-run`, then `npm run db:push`. This changes the shared
   demo database, so write migrations that apply cleanly on top of existing data.
4. Regenerate types: `npm run db:types` (run `npx supabase login` once first) and commit
   `src/lib/db/database.types.ts`.
5. Add or update pgTAP tests in `supabase/tests/` for RLS policies and stock functions. CI runs them
   in a throwaway Supabase stack on the GitHub runner.

Never edit a migration that has been applied to the hosted project; write a new one.

## Testing

| What                               | Command                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| Unit tests (domain rules, helpers) | `npm test` or `npm run test:watch`                       |
| One test file                      | `npx vitest run src/lib/domain/pricing`                  |
| Database tests (pgTAP)             | CI only (`.github/workflows/ci.yml`)                     |
| End-to-end                         | `npm run e2e` (see [e2e/README.md](../../e2e/README.md)) |

## Troubleshooting

| Symptom                                          | Fix                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Every page errors; Supabase requests time out    | The Free plan pauses after 7 idle days: restore the project from the dashboard                                            |
| `Invalid API key` or 401 from Supabase           | Keys were rotated; copy them again from Project Settings → API keys and restart `npm run dev`                             |
| `db:push` fails to connect                       | Check the password is percent-encoded in `SUPABASE_DB_URL`; on IPv4-only networks use the Session pooler URI from Connect |
| Type errors in `.next/types` after adding routes | `npm run typecheck` runs `next typegen` first; or restart `npm run dev`                                                   |
| A `.md` file inside `src/app/` became a page     | `pageExtensions` includes `md`/`mdx`; keep notes outside `src/app/`                                                       |
| Files show as fully changed on Windows           | `git config core.autocrlf false`, then `git add --renormalize .`                                                          |
