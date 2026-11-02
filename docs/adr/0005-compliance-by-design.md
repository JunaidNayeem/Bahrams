# 0005. Compliance by design: claims need records, honest pricing, DPDP, grievances

- Status: accepted (research, not legal advice; each item to be confirmed by the client's lawyer and CA)
- Date: 2026-10-31
- Source: [kickoff brief](../kickoff.md), "Legal & compliance in India" and "Authenticity signals"

## Context and problem statement

Three rule changes land inside the project window: the E-Commerce (Amendment) Rules from
**1 January 2027** (prior-price display, mandatory dark-pattern self-audit), the **DPDP Act 2023 and
Rules 2025** with most duties from **13 May 2027**, and the proposed **Handloom Mark** labelling
regulations. Bahram Silks is an inventory e-commerce entity selling its own stock, and its whole
positioning is proof of authenticity. Retrofitting compliance after launch would mean data we never
captured (price history, consent records, label numbers). What do we build into the platform now?

## Decision outcome

Compliance rules are encoded in data models and pure domain functions, so the UI cannot show
something the records do not support.

### 1. Claims need records

- Badges render only when the matching record exists, decided by `src/lib/domain/claims`:

  | Badge or wording           | Required record                                                                                                                                      |
  | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
  | "Pure Silk" / Silk Mark    | Silk Mark label number on the product or piece; link to verification on silkmarkindia.com                                                            |
  | "Handloom" / Handloom Mark | Valid Handloom Mark label number and a weaver or loom record                                                                                         |
  | "Bhagalpur Silk (GI)"      | `gi_eligible` flag set by staff with the evidence (traditional sourcing and weaving); otherwise the copy says "woven in Bhagalpur". GI year is 2013. |
  | Weaver credit              | Weaver record with the weaver's consent to be named                                                                                                  |

- A label-usage log records which label number went on which piece, for SMOI and Handloom Mark audits.
- Composition is stated per warp and weft (for example "tussar warp, ghicha weft"); blends are never
  described as pure silk.
- The logo and badges never imitate the Silk Mark cocoon, the Handloom Mark or the India Handloom
  Brand logo.

### 2. Prices and dark patterns

- Prior prices come only from validated price history ([ADR 0002](0002-money-tax-and-pricing.md)).
- The 13 dark patterns named in the CCPA Guidelines 2023 are banned in the codebase and audited before
  launch and yearly after ([compliance checklist](../compliance-checklist.md)). Concretely: no fake
  timers or "only 1 left" unless it is literally a one-of-a-kind piece in stock, no pre-ticked add-ons,
  all charges (shipping, COD fee, gift wrap) visible on product and cart pages, cancelling and
  unsubscribing as easy as signing up, no confirmshaming copy.
- The self-audit certificate, once required, is displayed in the footer (content managed in the CMS).

### 3. DPDP: consent and data-principal rights

- A standalone privacy notice in plain English (Hindi in Phase 2), linked at every collection point.
- **Separate opt-in per purpose** (`CONSENT_PURPOSES` in `src/lib/domain/enums.ts`): order processing,
  marketing email, marketing WhatsApp, marketing SMS, analytics. Marketing is never pre-ticked.
- **Consent log is append-only**: every grant and withdrawal is a new row with purpose, notice version,
  channel, timestamp and actor. Current state is derived, never overwritten. The table forbids
  `UPDATE` and `DELETE` through RLS and triggers.
- Withdrawal is one click from `/account/privacy` and from every marketing message.
- Analytics (GA4, Clarity) load only after analytics consent.
- Requests for access, correction and erasure are made at `/account/privacy`, tracked at
  `/admin/privacy-requests` with due dates. Erasure anonymises personal data on orders that must be
  kept for GST records rather than deleting the orders.
- Personal data is minimised (no date of birth, no card data), encrypted in transit and at rest
  (Supabase), and protected by RLS. A breach-response procedure is part of the going-live runbook.

### 4. Grievance redressal (Consumer Protection E-Commerce Rules, 2020)

- Seller legal name, address, GSTIN and contact in the footer; grievance officer's name, designation
  and contact on `/grievance`.
- Complaints submitted at `/grievance` get a ticket number and are tracked at `/admin/grievances`
  through `received → acknowledged → in_progress → resolved` (`GRIEVANCE_STATUSES`).
- **SLA: acknowledge within 48 hours, resolve within one month.** The admin shows time remaining and
  flags breaches on the dashboard.

### 5. Handloom Mark and Silk Mark registrations

- Registration starts in week 1 (brand and certifications workstream), because external lead times
  are the longest in the plan.
- Until the client is registered and labels are attached, the "Handloom" badge stays off even if a
  product is handwoven; copy may describe the process factually ("woven on a pit loom in Nathnagar").
- The regulations were still described as draft in September 2026 (proposed entry into force
  1 October 2026). Status must be verified before launch.

### Consequences

- Good: the site can be audited from its own data; the marketing team cannot accidentally over-claim.
- Good: compliance features are ready before the 2027 deadlines rather than retrofitted.
- Bad: more admin data entry (label numbers, weaver records, evidence for GI). Mitigated by bulk CSV
  import and per-piece label fields in the product form.
- Bad: products without registrations launch with fewer badges, which is the honest outcome.

## More information

- [Compliance checklist](../compliance-checklist.md)
- [Open questions](../open-questions.md) (legal entity, GSTIN, grievance officer, existing registrations)
