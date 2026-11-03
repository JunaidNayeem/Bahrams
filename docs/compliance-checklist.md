# Pre-launch compliance checklist

Turns the brief's "Legal & compliance in India" table into checks we can verify on the platform.
This is research, not legal advice: the client's lawyer and CA sign off the items marked **Legal** or
**CA**. Gate 3 (launch readiness) requires every row to be Done or Waived.

Status values: **Todo**, **In progress**, **Done**, **Blocked** (see [open questions](open-questions.md)), **Waived** (owner sign-off recorded).

Owners: **Tech** (tech lead / developers) · **Ops** (client operations owner) · **Content** (SEO and
content writer) · **Legal** (client's lawyer) · **CA** (client's chartered accountant)

## Consumer Protection (E-Commerce) Rules, 2020 (in force)

| #   | Check on the platform                                                                                                                               | Owner          | Status                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------ |
| C1  | Footer shows legal entity name, registered address, GSTIN, customer-care email and phone                                                            | Tech + Ops     | Done                     |
| C2  | `/grievance` names the grievance officer (name, designation, email, phone) and offers a complaint form                                              | Tech + Ops     | Blocked: officer details |
| C3  | Complaints get a ticket number and an acknowledgement email immediately; admin flags any not acknowledged within **48 hours**                       | Tech           | Todo                     |
| C4  | Admin flags complaints not resolved within **one month**; dashboard shows breaches                                                                  | Tech           | Todo                     |
| C5  | Product pages show total price including GST, all charges, country of origin (India), seller, composition, dimensions, care, and return eligibility | Tech + Content | Todo                     |
| C6  | Return, refund, exchange, shipping and cancellation terms are linked from product, cart and checkout pages                                          | Tech + Content | Todo                     |
| C7  | Refunds to source are processed and logged; refund timelines stated on `/legal/returns-policy`                                                      | Tech + Ops     | Todo                     |

## E-Commerce (Amendment) Rules, 2026 (from 1 January 2027)

| #   | Check on the platform                                                                                                       | Owner       | Status |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| A1  | Every discounted price shows the reduced price **and** the prior price                                                      | Tech        | Todo   |
| A2  | Prior prices come only from `price_history` validated by `src/lib/domain/pricing`; admin cannot type a free-form compare-at | Tech        | Todo   |
| A3  | Dark-pattern self-audit completed (section below) and the certificate displayed where the rules require                     | Ops + Legal | Todo   |
| A4  | Search and collection ranking contains no undisclosed sponsored placement                                                   | Tech        | Todo   |

## Dark Patterns Guidelines, 2023 (in force): the 13 specified patterns

Each pattern is checked on home, collection, product, cart, checkout, account and emails. Record the
reviewer and date for each row.

| #   | Pattern                 | What we check                                                                                                              | Owner           | Status |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------- | ------ |
| D1  | False urgency           | No countdown timers except a real deadline (reservation hold, real sale end); "only 1 left" only for real quantity-1 stock | Tech + Content  | Todo   |
| D2  | Basket sneaking         | Nothing added to the cart by default: gift wrap, insurance, swatches, donations all opt-in                                 | Tech            | Todo   |
| D3  | Confirm shaming         | No guilt copy on decline buttons or exit prompts ("No, I don't like handloom")                                             | Content         | Todo   |
| D4  | Forced action           | Guest checkout works; no forced account, app download or newsletter signup to buy                                          | Tech            | Todo   |
| D5  | Subscription trap       | No subscriptions in MVP; marketing unsubscribe is one click and as easy as subscribing                                     | Tech            | Todo   |
| D6  | Interface interference  | Decline and accept options have equal visual weight; no pre-selected marketing consent                                     | Tech + Design   | Todo   |
| D7  | Bait and switch         | Advertised price, availability and offer match what is sold; sold-out pieces are not advertised as available               | Tech + Ops      | Todo   |
| D8  | Drip pricing            | Shipping, COD fee and gift wrap shown on product page and cart before checkout; the payment step adds nothing new          | Tech            | Todo   |
| D9  | Disguised advertisement | Influencer and paid content labelled as advertisement; sponsored placements disclosed                                      | Content         | Todo   |
| D10 | Nagging                 | No repeated pop-ups; newsletter prompt at most once per session and dismissible                                            | Tech            | Todo   |
| D11 | Trick question          | Consent and opt-out wording is plain, no double negatives                                                                  | Content + Legal | Todo   |
| D12 | SaaS billing            | Not applicable in MVP (no recurring billing); recheck if subscriptions are added                                           | Tech            | Todo   |
| D13 | Rogue malpractices      | No malware, phishing-style flows or misleading redirects; third-party scripts limited to the CSP allow-list                | Tech            | Todo   |

## DPDP Act 2023 and Rules 2025 (most duties from 13 May 2027; build now)

| #   | Check on the platform                                                                                                  | Owner           | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------------- | ------ |
| P1  | Standalone privacy notice at `/legal/privacy`, versioned, in plain language, linked at every data-collection point     | Content + Legal | Todo   |
| P2  | Separate opt-in per purpose (order processing, marketing email, WhatsApp, SMS, analytics); nothing pre-ticked          | Tech            | Todo   |
| P3  | Consent log is append-only (no UPDATE/DELETE via RLS or triggers); records purpose, notice version, channel, timestamp | Tech            | Todo   |
| P4  | Withdrawal as easy as giving consent: one click at `/account/privacy` and in every marketing message                   | Tech            | Todo   |
| P5  | GA4 and Clarity load only after analytics consent                                                                      | Tech            | Todo   |
| P6  | Access, correction and erasure requests can be made and are tracked with due dates in `/admin/privacy-requests`        | Tech + Ops      | Todo   |
| P7  | Account deletion anonymises personal data and keeps only records the law requires (GST invoices)                       | Tech + CA       | Todo   |
| P8  | Security safeguards: RLS on every table, service-role key server-only, TLS everywhere, encrypted backups, staff 2FA    | Tech            | Todo   |
| P9  | Breach-response procedure written (who notifies the Data Protection Board and users, within what time)                 | Ops + Legal     | Todo   |
| P10 | Data retention periods defined and enforced by scheduled purge (carts, logs, inactive accounts)                        | Tech + Legal    | Todo   |

## Handloom Mark, Silk Mark and GI

| #   | Check on the platform                                                                                                | Owner          | Status |
| --- | -------------------------------------------------------------------------------------------------------------------- | -------------- | ------ |
| H1  | Handloom Mark registration filed in week 1; current status of the regulations verified before launch                 | Ops + Legal    | Todo   |
| H2  | "Handloom" badge renders only for products with a valid Handloom Mark label number and weaver or loom record         | Tech           | Todo   |
| H3  | Silk Mark authorised-user registration with SMOI; label number per piece; verification link on product pages         | Ops + Tech     | Todo   |
| H4  | Label-usage log exportable for audits                                                                                | Tech           | Todo   |
| H5  | "Bhagalpur Silk (GI)" appears only on GI-eligible products; elsewhere "woven in Bhagalpur"; GI year 2013 in all copy | Tech + Content | Todo   |
| H6  | Logo and badges do not resemble the Silk Mark, Handloom Mark or India Handloom Brand logos                           | Design + Legal | Todo   |
| H7  | Composition stated per warp and weft; no blend described as pure silk                                                | Content        | Todo   |

## GST

| #   | Check on the platform                                                                                         | Owner     | Status |
| --- | ------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| G1  | HSN and GST rate on every product (5007 silk, 5208/5209 cotton; sarees as fabric), snapshotted on order lines | Tech + CA | Todo   |
| G2  | GST invoices: sequential per financial year, GSTIN, HSN, taxable value, CGST+SGST (Bihar) or IGST             | Tech + CA | Todo   |
| G3  | B2B GSTIN captured at checkout and printed on the invoice                                                     | Tech      | Todo   |
| G4  | GST reports (B2C, B2B, HSN summary) export in a GSTR-1-ready format                                           | Tech + CA | Todo   |
| G5  | Stitched garments (kurtas, blouses) use the apparel rate by price as confirmed by the CA                      | CA        | Todo   |

## Payments and refunds

| #   | Check on the platform                                                                                                 | Owner      | Status |
| --- | --------------------------------------------------------------------------------------------------------------------- | ---------- | ------ |
| R1  | No card data stored or logged anywhere; only Razorpay ids                                                             | Tech       | Todo   |
| R2  | Refunds default to source; manual COD refunds recorded with UTR                                                       | Tech + Ops | Todo   |
| R3  | Razorpay live mode only after hosting moves off Vercel Hobby ([ADR 0004](adr/0004-payments-test-mode-and-hosting.md)) | Tech + Ops | Todo   |

## Legal pages (before launch)

| #   | Page                                                                                     | Owner       | Status |
| --- | ---------------------------------------------------------------------------------------- | ----------- | ------ |
| L1  | Terms `/legal/terms`                                                                     | Legal       | Todo   |
| L2  | Privacy `/legal/privacy`                                                                 | Legal       | Todo   |
| L3  | Shipping `/legal/shipping-policy`                                                        | Ops + Legal | Todo   |
| L4  | Returns and exchanges `/legal/returns-policy`                                            | Ops + Legal | Todo   |
| L5  | Cancellation `/legal/cancellation`                                                       | Ops + Legal | Todo   |
| L6  | Grievance officer `/grievance`                                                           | Ops + Legal | Todo   |
| L7  | Contact `/contact`                                                                       | Ops         | Todo   |
| L8  | All legal pages editable in the CMS, versioned, and linked in the footer and at checkout | Tech        | Todo   |
