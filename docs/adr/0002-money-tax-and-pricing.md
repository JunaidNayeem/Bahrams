# 0002. Money in integer paise, GST-inclusive prices, genuine prior prices

- Status: accepted (tax rates and the prior-price window to be confirmed by the client's CA and lawyer)
- Date: 2026-10-31
- Source: [kickoff brief](../kickoff.md), "Legal & compliance in India" (GST, E-Commerce Amendment Rules)

## Context and problem statement

Prices, taxes, discounts, shipping and COD fees must add up to the paisa on the storefront, the
Razorpay order, the GST invoice and the GSTR-1 export. Indian consumer rules require the total price
including all charges to be shown upfront, and from 1 January 2027 any discount must show the
reduced price next to a genuine "prior price". How do we represent and calculate money?

## Decision drivers

- No floating-point drift between cart, payment gateway and invoice.
- Razorpay takes amounts in paise (integer), so matching it removes a conversion step.
- Consumers see one honest, tax-inclusive price; no drip pricing (Dark Patterns Guidelines 2023).
- GST invoices need taxable value, HSN and CGST/SGST or IGST per line.
- A compare-at price must be provable from records, not typed in freely.

## Decision outcome

### Representation

- **All money is an integer number of paise** (`number` in TypeScript, `bigint` or `integer` columns
  named `*_paise` in Postgres). ₹4,850.00 is `485000`. `Number.MAX_SAFE_INTEGER` paise is far beyond
  any order value.
- Currency is INR only in the MVP (multi-currency is Phase 2). Format only at the edge with
  `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })` on `paise / 100`.
- Never store or compute money as a float or a decimal string in application code.
- Quantities: pieces are integers; fabric is sold per metre in 0.5 m steps. A fabric line total is
  `Math.round(pricePerMetrePaise * metres)` (half-up), computed once and stored on the order line.

### Tax (GST)

- **Displayed prices are GST-inclusive.** The catalogue stores the inclusive selling price; tax is
  extracted, not added.
- Each product stores its **HSN code and GST rate**, defaulted from its kind and fibre and editable in
  the admin. Both are **snapshotted onto the order line** so later rate changes never rewrite history.

  | Goods                                                                                    | HSN               | Rate (from Sept 2025 changes)                                                                    |
  | ---------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
  | Silk sarees and silk fabric (sarees are fabric, not garments)                            | 5007              | 5%                                                                                               |
  | Cotton sarees and cotton fabric                                                          | 5208 / 5209       | 5%                                                                                               |
  | Linen fabric                                                                             | 5309              | 5% (TODO(client): confirm with CA)                                                               |
  | Stitched garments (kurtas, blouses), stoles and dupattas (6214), furnishings (6302–6304) | Chapters 61/62/63 | Value slab per piece: 5% up to ₹2,500, 18% above (as coded in `GST_RATE_RULES`); confirm with CA |

- Per line, tax is extracted from the inclusive amount with integer half-up rounding
  (`src/lib/domain/tax/gst.ts`), and the split always reconciles: taxable value + tax equals exactly
  what the customer paid.
- Place of supply: the seller is in Bihar (state code `10`, `siteConfig.sellerState`). Delivery
  inside Bihar → CGST + SGST in equal halves, with any odd paisa absorbed by the taxable value;
  elsewhere → IGST.
- Where the HSN rate depends on price (stitched apparel), the rate is resolved per unit from the
  GST-inclusive price.
- Shipping, gift wrap and COD fees are charges on the same supply and are taxed at the rate of the
  principal goods (composite supply). TODO(client): confirm with the CA.
- B2B buyers can enter a GSTIN at checkout; it is printed on the invoice and drives the B2B section of
  the GST report.

### Discounts and the prior-price rule

- A **compare-at ("prior") price is displayed only when `src/lib/domain/pricing` validates it against
  `price_history`.** Every price change, including scheduled sale prices, writes an append-only
  `price_history` row (price, effective from/to, actor).
- Default rule (pending legal confirmation): the prior price must be higher than today's price and
  must have been charged on the site for an unbroken run of at least `PRIOR_PRICE_MIN_DAYS` (7) within
  the last `PRIOR_PRICE_LOOKBACK_DAYS` (90) days (`src/lib/domain/pricing/prior-price.ts`). If no
  such price exists, the product shows only its current price.
- Coupons and automatic offers are applied to GST-inclusive amounts and allocated pro rata across lines
  (largest-remainder, so the allocation sums exactly); tax is then extracted from each discounted line.
- The prepaid incentive is a visible discount line, never a silent price difference.
- No fake countdowns, no pre-ticked add-ons (gift wrap, insurance), no fees revealed only at the last
  step: shipping and COD fees appear on the product page and cart, before checkout.

### Consequences

- Good: storefront, Razorpay order, invoice and reports agree to the paisa; tests can assert exact values.
- Good: compare-at prices are auditable, which the 2027 amendment rules and the yearly dark-pattern
  self-audit will require.
- Bad: every display path must remember to format; mitigated by a single `formatInr(paise)` helper and
  a price component in the design system.
- Bad: staff cannot "just type" a strike-through price; they must schedule a genuine price change.

## More information

- [ADR 0005: Compliance by design](0005-compliance-by-design.md)
- [Compliance checklist](../compliance-checklist.md)
