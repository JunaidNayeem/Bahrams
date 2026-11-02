// Applies pending migrations in supabase/migrations to the project in SUPABASE_DB_URL (no Docker).
// Reading the URL here keeps the database password out of shell quoting and command history.
//
// Usage: npm run db:push                      # migrations only
//        npm run db:push -- --include-seed    # also run supabase/seed.sql (empty projects only)
//        npm run db:push -- --dry-run         # list what would be applied
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) throw new Error("SUPABASE_DB_URL is missing; run with --env-file=.env.local");

// Run the CLI's JS entry with node directly: no shell, so the password's %-escapes reach it intact.
const cli = createRequire(import.meta.url).resolve("supabase/dist/supabase.js");
const { status } = spawnSync(
  process.execPath,
  [cli, "db", "push", "--db-url", dbUrl, ...process.argv.slice(2)],
  {
    stdio: "inherit",
  },
);
process.exit(status ?? 1);
