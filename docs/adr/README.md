# Architecture decision records

Decisions in [MADR](https://adr.github.io/madr/) style. Add a new file `NNNN-short-title.md` for any
decision that is expensive to reverse or that a new engineer would otherwise ask about. Never rewrite
an accepted ADR; supersede it with a new one and update the status line of the old one.

| ADR                                              | Decision                                                                        | Status   |
| ------------------------------------------------ | ------------------------------------------------------------------------------- | -------- |
| [0001](0001-stack-nextjs-supabase-free-tier.md)  | One Next.js app on Vercel with Supabase, on free tiers (not Medusa)             | Accepted |
| [0002](0002-money-tax-and-pricing.md)            | Integer paise, GST-inclusive prices, genuine prior prices                       | Accepted |
| [0003](0003-one-of-a-kind-stock-reservations.md) | Reserve at checkout start, 15-minute TTL, commit on capture or COD confirmation | Accepted |
| [0004](0004-payments-test-mode-and-hosting.md)   | Razorpay test mode while on Vercel Hobby; go-live checklist                     | Accepted |
| [0005](0005-compliance-by-design.md)             | Claims need records, honest pricing, DPDP consent log, grievance SLAs           | Accepted |
| [0006](0006-caching-and-rendering.md)            | Cache Components: tagged public cache, Suspense for per-user data, static CSP   | Accepted |
| [0007](0007-url-scheme-and-seo.md)               | URL map, canonicals and noindex rules                                           | Accepted |
