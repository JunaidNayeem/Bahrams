# Ekart integration: research and proposed design

Research date: 2026-11-06. Status: proposal, nothing built yet. It replaces the plan in
`docs/kickoff.md` → Shipping and backlog ORD-08 to "book manually, then Shiprocket" if the owner
chooses Ekart direct.

**Scope:**

- One pickup point: our Bhagalpur warehouse.
- Returns go back to that same warehouse, both RTOs and customer returns.
- Delivery anywhere in India.
- A pincode check shoppers can use before they buy.

## 1. Summary

- **Use the Elite platform, not the legacy API.** Ekart's self-serve product for D2C sellers is
  **Ekart Elite** (`app.elite.ekartlogistics.in`). Ekart is retiring the legacy v2 API at
  `api.ekartlogistics.com` and moving everyone to Elite, with time-bound OAuth2 bearer tokens,
  weights in grams and epoch-millisecond timestamps ([Unicommerce][uc]). Do not build against
  older Ekart PDFs, such as the Scribd copies, or anything that uses `merchant_code`.
- **Ekart's spec is not public.** The FAQ says "API documentation will be shared for
  integration" ([Ekart FAQ][faq]). Once we have an account, the docs are in the panel under
  **Settings → API Settings → API Documentation** ([EasyEcom][easy], [Zepio][zepio]).
- **The design below is built from the best public source available.** That source is an MIT
  Go client, [`entanglesoftware/ekart`][gosdk] (v0.1.0, Aug 2026). I read its source and
  confirmed every endpoint path and field name below against it. It is still unofficial, so
  check each item against Ekart's own docs once we have access.
- **Every scope item maps to an Ekart feature:**

  | Our need                    | Ekart Elite feature                                                                                    |
  | --------------------------- | ------------------------------------------------------------------------------------------------------ |
  | One pickup point            | Register the warehouse once as an address alias, then send it as `pickup_location` on every shipment   |
  | Returns to the same place   | Send the same alias as `return_location`. Customer returns are shipments with `payment_mode: "Pickup"` |
  | Pincode check               | A bulk serviceability download for nightly sync, plus a live check for each order                      |

- **Two blockers need confirming before any code is written:**
  1. **Pickup coverage for Bhagalpur.** Ekart picks up from about 5,000 pincodes and delivers to
     about 15,000 ([Ekart FAQ][faq]). If our warehouse pincode is outside the 5,000, Ekart direct
     does not work at all.
  2. **Liability cap.** Ekart pays "50% of shipment value or Rs 2000, whichever is lower" for
     loss or damage, and only pays more "if the shipment is insured" ([Ekart FAQ][faq]). For
     ₹8,000–₹40,000 silk sarees, we need insurance terms in writing.
- **Ekart alone will not cover all of India.** India has about 19,000 pincodes and Ekart
  delivers to about 15,000. Section 9 covers whether to accept that or keep a second courier as
  a fallback.

## 2. What we already have

The schema was built for a courier integration from the start, so most of the work is wiring.

| Existing piece                                                                                                                                  | Ekart use                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `serviceable_pincodes`: pincode, city, state, zone, `cod_available`, `prepaid_available`, `est_days_*`, `active` ([migration][m10])             | Filled by a nightly Ekart sync instead of by hand                                                                                                   |
| `getPincode()` with `"use cache"` + `cacheTag("pincodes")` ([src/lib/data/product.ts](../../src/lib/data/product.ts))                           | No change; the sync calls `revalidateTag("pincodes")`                                                                                               |
| `checkDelivery` server action + `<DeliveryCheck>` on the product page ([actions.ts](<../../src/app/(store)/products/[slug]/actions.ts>))         | No change for the product page. Checkout adds a live Ekart check                                                                                    |
| `estimateDelivery()` (dispatch 1–2 business days + transit) ([shipping.ts](../../src/lib/domain/shipping.ts))                                   | Transit time comes from Ekart's `tat.min` / `tat.max`                                                                                               |
| `shipments`, `shipment_items`, `shipment_events` with AWB, status, NDR and RTO fields ([migration][m06])                                        | One row per Ekart shipment. `awb` holds Ekart's `tracking_id`                                                                                       |
| `returns.reverse_courier`, `reverse_awb`, `pickup_scheduled_at`, `qc_notes`                                                                      | Customer-return pickups                                                                                                                             |
| `webhook_events` (unique on provider + event_id)                                                                                                 | Prevents processing the same Ekart webhook twice                                                                                                    |
| Private `shipping-labels` storage bucket (PDF)                                                                                                   | Stores the label PDFs Ekart returns                                                                                                                 |
| `pg_cron` (already runs reservation release and the content scheduler)                                                                           | Runs the nightly pincode sync and the tracking poll                                                                                                 |
| Admin `/admin/shipments` with NDR and COD columns                                                                                                | Gains Book, Label, Cancel and NDR action buttons                                                                                                    |

## 3. Ekart Elite API reference

Base URL: `https://app.elite.ekartlogistics.in`. Requests and responses are JSON. All endpoints
need `Authorization: Bearer <token>` except auth and public tracking.

Source: the [`entanglesoftware/ekart`][gosdk] source code. Check each item against Ekart's docs.

### Auth

```
POST /integrations/v2/auth/token/{client_id}
{ "username": "<elite login>", "password": "<elite password>" }
→ { "access_token": "...", "token_type": "Bearer", "expires_in": <seconds>, "scope": "core:all" }
```

The endpoint returns the same token for 24 hours, so calling it repeatedly is cheap. The
Client ID is shown under Settings → API Settings → API Documentation (eye icon).

### Endpoints we need

| Purpose                           | Method + path                                     | Notes                                                                                                                       |
| --------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Register the warehouse            | `POST /api/v2/address`                            | `alias, phone, address_line1, address_line2, pincode, city, state, country, geo`. Can also be done in the panel             |
| List addresses                    | `GET /api/v2/addresses`                           |                                                                                                                             |
| Check one pincode                 | `GET /api/v2/serviceability/{pincode}`            | → `status`, `details{cod, max_cod_amount, forward_pickup, forward_drop, reverse_pickup, reverse_drop, city, state}`         |
| Check a route, with price and TAT | `POST /data/v3/serviceability`                    | Request and response below                                                                                                  |
| All pincodes at once              | `GET /data/serviceability/bulk/NON_LARGE?format=JSON` | → `serviceability[]{pincode, fm, lmCod, lmPrepaid, rvp}`                                                                |
| Rate estimate                     | `POST /data/pricing/estimate`                     | → zone, volumetric and billing weight, shipping, RTO, COD and QC charges, taxes, total                                      |
| Create shipment                   | `PUT /api/v1/package/create`                      | Forward or reverse. Request and response below                                                                              |
| Cancel                            | `DELETE /api/v1/package/cancel?tracking_id=…`     | Before pickup                                                                                                               |
| Label                             | `POST /api/v1/package/label?json_only=false`      | PDF                                                                                                                         |
| Manifest                          | `POST /data/v2/generate/manifest`                 | → `manifestNumber`, `manifestDownloadUrl`                                                                                   |
| Change dispatch date              | `POST /data/shipment/dispatch-date`               | `{ ids[1..100], dispatchDate: "YYYY-MM-DD" }`                                                                               |
| Add e-way bill                    | `POST /data/shipment/ewbn`                        | `{ id, ewbn }` (12 digits)                                                                                                  |
| Track (authenticated)             | `GET /data/v1/elite/track/{wbn}`                  |                                                                                                                             |
| Track (public)                    | `GET /api/v1/track/{id}`                          | Public page for shoppers: `{base}/track/{tracking_id}`                                                                      |
| NDR action                        | `POST /api/v2/package/ndr`                        | `{ action: "Re-Attempt" \| "RTO", wbn, date (epoch ms, within 7 days), phone?, address?, instructions? }`                    |
| Webhooks                          | `POST /api/v2/webhook`, `GET /api/v2/webhook`, `PUT /api/v2/webhook/{id}` | `{ url, secret (6–30 chars), topics: ["track_updated", "shipment_created", "shipment_recreated"], active }` |

### Route check (`POST /data/v3/serviceability`)

The API takes every number as a string. The response is an array with one entry per courier
group.

```jsonc
// request
{ "pickupPincode": "<warehouse pin>", "dropPincode": "560001",
  "weight": "800", "length": "35", "width": "25", "height": "6",
  "paymentType": "COD", "codAmount": "4200", "invoiceAmount": "4200", "serviceType": "SURFACE" }
// response
[ { "tat": { "min": 4, "max": 6 }, "courierGroup": "...",
    "forwardDeliveredCharges": { "forwardFreight": "...", "codCharges": "...", "totalForwardDeliveredEstimate": "..." },
    "rtoDeliveredCharges": { "totalRTODeliveredEstimate": "..." },
    "reverseDeliveredCharges": { "totalReverseDeliveredCharges": "..." } } ]
```

### Create shipment (`PUT /api/v1/package/create`)

```jsonc
{
  "order_number": "BS-2026-00123", "invoice_number": "INV/26-27/0045", "invoice_date": "2026-11-06",
  "seller_name": "Bahram Silks", "seller_address": "...", "seller_gst_tin": "10XXXXX...",
  "consignee_name": "...", "consignee_alternate_phone": "98xxxxxxxx",
  "products_desc": "Tussar silk saree", "category_of_goods": "Apparel", "hsn_code": "5007",
  "payment_mode": "COD",          // "COD" | "Prepaid" | "Pickup" (= reverse pickup)
  "cod_amount": 4200,             // rupees, 0–49,999; 0 for prepaid
  "total_amount": 4200, "taxable_amount": 4000, "tax_value": 200, "commodity_value": "4000",
  "consignee_gst_amount": 0, "quantity": 1,
  "weight": 800, "length": 35, "width": 25, "height": 6,   // grams, cm
  "drop_location":   { "name": "...", "address": "...", "city": "...", "state": "...", "pin": 560001, "phone": 98xxxxxxxx, "country": "India", "location_type": "Home" },
  "pickup_location": { "name": "BAHRAM-BGP-WH" },   // registered alias, other fields optional
  "return_location": { "name": "BAHRAM-BGP-WH" },
  "ewbn": "",                     // needed when goods value ≥ ₹50,000
  "preferred_dispatch_date": "2026-11-07"
}
// → { "status": true, "remark": "...", "tracking_id": "<AWB>", "vendor": "...", "barcodes": { "wbn": "...", "order": "..." } }
```

A **reverse pickup** uses the same endpoint with:

- `"payment_mode": "Pickup"`;
- a `return_reason`, which is required;
- an optional `qc_details` block for doorstep checks: `product_name`, `product_color`,
  `product_sku`, `product_images[]` and so on.

**To confirm with Ekart:** on a reverse pickup, which location field holds the customer's
address and which holds the warehouse.

### Tracking statuses

Ekart's statuses are an open set, so new values can appear. Each update carries `status`,
`ctime` (epoch ms), `desc`, `location`, `ndrStatus`, `attempts`, `ndrActions` and an `edd` once
the parcel is picked up.

Known values:

- Order Placed
- Pickup Pending / Pickup Scheduled / Out for Pickup / Picked Up
- In Transit / Shipment Delayed
- Out for Delivery / Delivered / Undelivered
- RTO Requested / Seller RTO Requested / RTO In Transit / RTO Out for Delivery / RTO Delivered
  / RTO Failed / RTO Shipment Delayed
- Cancelled / Seller Cancelled / Pickup Cancelled
- Lost / Damaged
- Not Serviceable / Not Picked

### Operating terms from Ekart's FAQ

Source: [Ekart FAQ][faq]. Confirm each one for our account.

- **Onboarding:**
  - KYC with PAN and GST. Proprietorships can onboard on PAN alone.
  - Verification takes 24–48 working hours.
  - No security deposit.
  - The prepaid wallet needs at least ₹500 before it can generate AWBs.
- **Pricing:** choose one rate card.
  - "Flat Pricing": ₹90 per shipment, covering forward, RTO and COD charges.
  - "Tiered pricing": better when RTO and COD rates are low.
- **Pickup:** orders booked before 11 am on a working day can be picked up the same day.
- **Weight:** "currently processing only shipments <4kg".
- **Services Ekart does not offer:**
  - Air, One Day and Two Day delivery: "We do not offer air services currently".
  - Open-box delivery.
  - COD verification and WhatsApp messages on Elite ("Not active for Elite yet").
- **COD:**
  - Ekart remits every Thursday for parcels delivered by Tuesday.
  - The fee applies only when cash is actually collected.
  - Ekart collects at most ₹49,999 per parcel ([Zepio][zepio]).
- **Reattempts:** 5 at pickup and 3 at delivery.
- **Reverse pickups (RVP):** available.
- **Support:** tickets in the panel, with a 24-hour response time.

## 4. Pincode check

### Why not call Ekart live on every product page?

- **Speed:** the product page is cached and server-rendered.
- **Account risk:** bots and crawlers would hit our paid Ekart account directly.
- **Unknown limits:** Ekart has not published its rate limits.

So the check works in two layers. A cached local table answers shoppers instantly. A live call
confirms the result at checkout, when the cart's weight and payment method are known.

```
Nightly (pg_cron → POST /api/cron/ekart-pincodes, protected by CRON_SECRET)
  GET /data/serviceability/bulk/NON_LARGE?format=JSON
    → about 15k rows {pincode, fm, lmCod, lmPrepaid, rvp}
  join India Post pincode directory (city, district, state, state_code)
  upsert into serviceable_pincodes:
      prepaid_available = lmPrepaid
      cod_available     = lmCod
      rvp_available     = rvp          (new column)
      active            = lmPrepaid OR lmCod
      zone, est_days_*  = from shipping_zones (zone transit times, step 3 below)
  pincodes missing from today's file → active = false (keep the row for history)
  revalidateTag("pincodes")

Product page (no change)
  <DeliveryCheck> → checkDelivery → getPincode (cached) → estimateDelivery → "Delivery by Wed 12 – Fri 14 Nov"

Checkout: address step and payment-method step
  POST /data/v3/serviceability with the cart's real weight, payment type and COD amount
    → confirms serviceability, gives the real TAT and our shipping cost
    → if Ekart is down or slow (more than 2 s), fall back to the table and warn ops
```

Steps:

1. **City and state.** Ekart's bulk file has no city or state, but our table requires them. Take
   them from the government's **All India Pincode Directory** ([data.gov.in][pin], Government
   Open Data Licence, free for commercial use). Load it once into a `pincode_directory`
   reference table and refresh it every quarter. The same table can power "address autofill from
   PIN code" at checkout, which the brief asks for.
2. **COD.** Take the app's COD decision from the stricter of three limits:
   - our own limit (₹5,000 by default, from settings);
   - Ekart's `lmCod` flag for the pincode;
   - Ekart's `max_cod_amount` for the pincode, read from the single-pincode endpoint at
     checkout.
3. **Transit time.** The bulk file has no delivery days. Fill `shipping_zones` with transit
   times measured from Bhagalpur: run the route check once per zone and store the results.
   Checkout then shows the exact `tat` from the live call. This keeps the product-page date
   honest without making about 15,000 API calls.
4. **Wording.** If a pincode is unknown, keep today's message ("message us on WhatsApp"). If it
   is known but not serviceable, say "Our courier doesn't deliver here yet". Do not name Ekart
   in this message; doing so would lock the copy to one courier.

## 5. Forward shipments: from order to doorstep

Shipments are booked only after an order is confirmed: payment captured, or COD confirmed. By
then the one-of-a-kind stock is already committed, so booking does not touch reservations.

1. **Book.** Staff click **Book with Ekart** on `/admin/orders/[id]`, or packing triggers it
   automatically. The server builds the create-shipment payload from three sources:
   - **Address:** the order's `shipping_address` snapshot.
   - **Invoice:** the GST invoice number and date.
   - **Package:** weight and dimensions from the product, or from a packaging template such as
     "saree box", "fabric roll" or "gift box".
   - **Money conversion:** the app stores integer paise; Ekart takes rupees as numbers. Convert
     in exactly one function at the Ekart boundary and never store the rupee value.
   - **Tax split:** displayed prices include GST, so `taxable_amount = total − tax`. Take both
     figures from the invoice, not by recalculating.
2. **Save the result.** Insert a `shipments` row:
   - `courier='ekart'`
   - `awb = tracking_id`
   - `tracking_url = https://app.elite.ekartlogistics.in/track/{tracking_id}`
   - `status='label_created'`
   - `cod_amount_paise`
3. **Prevent double booking.** Refuse to book while the order has a shipment that is not
   cancelled. Use the order number as Ekart's `order_number` so a retried request is visible in
   Ekart's panel.
4. **Label.** Fetch the PDF, store it in `shipping-labels/{order_id}/{awb}.pdf`, save the path in
   `label_path`, and print it from the admin.
5. **Pickup.** Book before 11 am for same-day pickup, or use `preferred_dispatch_date` to
   schedule. Generate the day's manifest once, at handover.
6. **Cancel.** Before pickup, call the cancel endpoint and set `status='cancelled'`.
7. **E-way bill.** For parcels worth ₹50,000 or more, generate the e-way bill and send `ewbn`
   (or add it after booking). Block booking if it is missing.

## 6. Tracking

**Primary: a webhook** at `src/app/api/webhooks/ekart/route.ts`, registered for `track_updated`
and `shipment_created`.

- Read the raw body with `await request.text()`, check its HMAC against
  `EKART_WEBHOOK_SECRET`, then parse it. **To confirm:** the header name and algorithm. The SDK
  says only that the secret "is used to compute the HMAC of the webhook body".
- Insert into `webhook_events` with `provider='ekart'` and
  `event_id = wbn + ':' + status + ':' + ctime`. On a duplicate, return 200 and do nothing
  else.
- Append a row to `shipment_events` with the raw payload.
- Map the Ekart status onto `shipments.status` with the table below, and advance the order
  state machine (`shipped → out_for_delivery → delivered`, `delivery_failed` on NDR).

**Backup: polling.** A `pg_cron` job every 2 hours calls `GET /data/v1/elite/track/{wbn}` for
shipments that are not yet in a final state and were last updated more than 6 hours ago.
Integrators do the same: Zepio falls back to a 30-minute poll ([Zepio][zepio]).

| Ekart status                                                     | `shipments.status`                      | Side effect                                         |
| ---------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------- |
| Order Placed                                                     | `label_created`                         |                                                     |
| Pickup Pending, Pickup Scheduled, Out for Pickup                 | `pickup_scheduled`                      |                                                     |
| Picked Up                                                        | `picked_up`                             | Order → `shipped`, send "shipped" email             |
| In Transit, Shipment Delayed                                     | `in_transit`                            | Store `edd`                                         |
| Out for Delivery                                                 | `out_for_delivery`                      |                                                     |
| Delivered                                                        | `delivered`                             | Order → `delivered`, starts the return window       |
| Undelivered (with `ndrStatus`)                                   | `ndr`                                   | `ndr_count++`, `ndr_reason`; adds to the NDR queue  |
| RTO Requested, Seller RTO Requested                              | `rto_initiated`                         |                                                     |
| RTO In Transit, RTO Out for Delivery, RTO Shipment Delayed       | `rto_in_transit`                        |                                                     |
| RTO Delivered                                                    | `rto_delivered`                         | Staff task: inspect the piece, then restock         |
| Cancelled, Seller Cancelled, Pickup Cancelled                    | `cancelled`                             |                                                     |
| Lost, Damaged, RTO Failed, Not Serviceable, Not Picked           | none yet; add `exception` to the check  | Urgent staff task; claim process                    |
| Anything else                                                    | No change                               | Keep the event and log it for review                |

**NDR handling.** Ekart makes 3 delivery attempts. The admin NDR queue offers:

- **Re-attempt:** sends `{action:"Re-Attempt", date}`, with an optional corrected phone number or
  address.
- **Return to origin:** sends `{action:"RTO"}`.

Contact the customer on WhatsApp first; this matches the RTO-reduction plan in the brief.

## 7. Returns

**RTO** (a forward parcel that could not be delivered) is automatic. It comes back to the
`return_location` alias, which is our warehouse, and we track it with the status mapping above.

**Customer returns** use reverse pickup:

1. The customer requests a return, which creates a `returns` row with status `requested`. Staff
   approve it.
2. Check `serviceable_pincodes.rvp_available` for the customer's pincode.
   - If false, offer self-ship to the warehouse and show the address.
3. Create the pickup with:
   - `payment_mode:"Pickup"`;
   - `return_reason`;
   - the customer's address as pickup and the warehouse alias as drop;
   - `qc_details` with the product name, colour, SKU and catalogue images.

   Doorstep QC matters for one-of-a-kind silk: it stops a different saree from being returned
   in place of ours. **To confirm:** whether Elite supports doorstep QC and what it costs (the
   rate estimate has a `qcCharge`).
4. Save `reverse_courier='ekart'` and `reverse_awb`, and set status `pickup_scheduled`. Reverse
   pickups need no label.
5. Updates arrive on the same webhook:
   - Picked Up: tell the customer.
   - Delivered (to our warehouse): status `received`, then staff QC (`qc_passed` or
     `qc_failed`), then refund to source, exchange or store credit, as built today.

Schema change: give `shipments` a `direction` (`forward` or `reverse`) and a nullable
`return_id`. Reverse pickups then reuse the same webhook, event and polling code;
`returns.reverse_awb` stays as a quick lookup.

## 8. Code layout (proposed)

```
src/lib/ekart/                   server-only ("server-only" import)
  client.ts                      fetch wrapper: base URL, token cache, 401 → refresh once,
                                 retry on 429/5xx with backoff, 10 s timeout, typed EkartError
  types.ts                       request/response types (from §3)
  serviceability.ts  shipments.ts  tracking.ts  ndr.ts  webhooks.ts
src/lib/domain/courier/          pure, unit-tested
  ekart-status.ts                Ekart status → shipment status (§6 table) + order transitions
  ekart-payload.ts               order + invoice → create-shipment payload (paise → rupees here only)
  types.ts                       CourierProvider interface (quote, book, cancel, label, track, ndr)
src/app/api/webhooks/ekart/route.ts
src/app/api/cron/ekart-pincodes/route.ts     nightly bulk sync
src/app/api/cron/ekart-track/route.ts        polling backup
```

- **Courier interface.** The admin pages and the order state machine should depend on
  `CourierProvider`, not on Ekart. A second courier, such as Shiprocket for pincodes Ekart does
  not cover, can then be added without touching them. The `shipments.courier` column already
  allows this.
- **Token.** Keep it in a module-level cache in each serverless instance, with an expiry.
  Because Ekart returns the same token for 24 hours, a cold start costs one cheap call. No
  token table is needed.
- **Environment variables.** None of these may be `NEXT_PUBLIC_`:
  - `EKART_CLIENT_ID`, `EKART_USERNAME`, `EKART_PASSWORD`
  - `EKART_WEBHOOK_SECRET`
  - `EKART_PICKUP_ALIAS`, `EKART_WAREHOUSE_PINCODE`
  - `CRON_SECRET`
- **Migration:**
  - `serviceable_pincodes`: add `rvp_available`, `max_cod_paise`, `source`, `synced_at`.
  - `shipments`: add `direction` and `return_id`; add `exception` to the status check.
  - New `pincode_directory` table.
  - New settings: `courier.pickup_alias` and `courier.warehouse_pincode`.
- **Tests:**
  - Vitest for the status map and the payload builder, covering paise rounding, COD vs prepaid,
    and the e-way bill threshold.
  - A webhook test with fixture payloads covering signature, duplicates and an unknown status.
  - A Playwright test with Ekart mocked at the network level for the checkout pincode path.
- **Sandbox.** No public sandbox has been found. eShipz's setup screen has a "Testing or
  Production" toggle ([eShipz][eshipz]), so ask Ekart for test credentials. Without them, test
  with a few real low-value parcels to a staff address.

## 9. Risks and decisions for the owner

| #   | Risk / decision                                                                                                                         | Recommendation                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Pickup coverage for the warehouse pincode.** Ekart picks up from only about 5,000 pincodes                                           | First thing to check, before any code. In the panel, or with `GET /api/v2/serviceability/{warehouse pin}`, `forward_pickup` and `reverse_drop` must both be `true`                                                                                                   |
| 2   | **Coverage is not all of India** (about 15k of about 19k pincodes)                                                                      | Accept for launch: unserviceable pincodes get the honest "not yet" message. Phase 2: add a second courier behind `CourierProvider`, or use an aggregator that includes Ekart                                                                                          |
| 3   | **Liability cap: 50% of value or ₹2,000.** Most sarees are worth ₹8k–₹40k                                                               | Get insurance and COF terms in writing, or buy transit insurance separately. The brief already says to insure shipments above a set value                                                                                                                            |
| 4   | **Under 4 kg only**                                                                                                                     | A saree weighs about 0.6–1 kg packed, which is fine. Large fabric orders by the metre may need splitting (`shipment_items` already supports this) or multi-package shipments (`mps`)                                                                                  |
| 5   | **No air or express service** per the FAQ, although the API has an `EXPRESS` service type                                               | Launch with surface delivery only and hide "express" until Ekart confirms                                                                                                                                                                                            |
| 6   | **Rate card**                                                                                                                           | Flat ₹90 covers forward, RTO and COD, which is predictable while our RTO rate is unknown. Re-check after 3 months of data                                                                                                                                             |
| 7   | **Spec is unofficial and not public**                                                                                                   | Build only after reading Ekart's panel docs. This report's field list is a cross-check, not the contract                                                                                                                                                              |
| 8   | **Ekart direct vs an aggregator.** The brief and backlog ORD-08 assumed Shiprocket                                                     | Ekart direct: Ekart's own rates, one relationship, no aggregator margin. Aggregator: multi-courier coverage and fallback, plus a margin. Both fit the same `CourierProvider` design, so we can start with Ekart and add more couriers later                           |
| 9   | **Hosting.** The project is on Vercel Hobby, which is non-commercial (ADR 0004)                                                         | Webhooks and cron jobs work technically, but real shipping is commercial use. Move hosting before go-live, in the same step as Razorpay live mode                                                                                                                     |

## 10. Plan

| Phase                   | Work                                                                                                                                                                                                                                                                                                          | Backlog link             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **0 · Business**        | Elite signup and KYC. Confirm pickup coverage for the warehouse pincode. Register the warehouse alias. Choose a rate card. Get insurance terms. Get API docs and test credentials. Raise the questions below                                                                                                    | Ops: "Courier and COD terms" |
| **1 · Pincode check**   | Migration. Load the pincode directory. `src/lib/ekart` client. Nightly bulk sync. Zone transit times. Live route check at checkout. Address autofill from pincode                                                                                                                                              | ADM-04, CHK              |
| **2 · Forward shipping** | Book, label, manifest and cancel from the admin. Webhook and polling. Status mapping and order transitions. "Shipped" and "delivered" emails with the tracking link                                                                                                                                           | ORD-04 → ORD-08          |
| **3 · Exceptions and returns** | NDR queue and actions. RTO receiving. Reverse pickups with QC. Weekly COD remittance reconciliation (no remittance API found yet; start with a CSV export from the panel)                                                                                                                            | ORD, RET, PAY-07         |

## 11. Questions for the Ekart account manager

1. Is our warehouse pincode in first-mile (pickup) coverage? What is the daily pickup cutoff and
   pickup window there?
2. Please share the official Elite API documentation and test or sandbox credentials. Are there
   rate limits?
3. Webhooks: which header carries the signature, which algorithm is used (HMAC-SHA256?), what is
   the full payload, and what is the retry policy?
4. Reverse pickups on Elite:
   - Which location field holds the customer and which the warehouse?
   - Is doorstep QC supported, and what does it cost?
   - Are pre-assigned reverse AWBs needed? (Ekart's older reverse API required them
     ([ClickPost][cp]).)
5. Insurance: what does cover beyond "50% / ₹2,000" cost, and how are claims made?
6. Is express or air service available from our pincode? Is the 4 kg limit firm?
7. COD: is there a remittance report or API, and what is the per-pincode maximum?
8. Does a duplicate `order_number` get rejected (protecting against double booking)?

## Sources

- [Ekart Logistics FAQ][faq]: onboarding, pricing, coverage, limits, COD, reverse pickups.
- [entanglesoftware/ekart Go client][gosdk] (MIT, unofficial): endpoint paths and field names,
  read from the [source on GitHub](https://github.com/entanglesoftware/ekart/tree/main/pkg/ekart).
- [Unicommerce: Ekart 2.0 integration][uc]: move from the legacy API to Elite, OAuth2, grams and
  epoch time.
- [EasyEcom: Ekart Elite integration][easy]: where the panel shows credentials, addresses and
  webhooks.
- [Zepio: Connect Ekart][zepio]: pickup address matching, ₹49,999 COD cap, polling fallback.
- [eShipz: Ekart Elite carrier setup][eshipz]: credential fields, test vs production.
- [ClickPost: Ekart reverse][cp]: how reverse pickups worked on the legacy API.
- [data.gov.in: All India Pincode Directory][pin]: city, district and state per pincode.
- [Ekart Elite on the Shopify App Store](https://apps.shopify.com/elite-ekart-lite), as evidence
  that Elite is Ekart's current D2C product.

[faq]: https://www.ekartlogistics.in/faq
[gosdk]: https://pkg.go.dev/github.com/entanglesoftware/ekart/pkg/ekart
[uc]: https://support.unicommerce.com/index.php/knowledge-base/ekart-2-0-integration/
[easy]: https://support.easyecom.io/portal/en/kb/articles/ekart-elite-integration
[zepio]: https://zepio.io/help/articles/connect-ekart
[eshipz]: https://eshipz1.zohodesk.in/portal/en/kb/articles/steps-to-integrate-ekart-elite-carrier
[cp]: https://docs.clickpost.ai/docs/ekart-rvp
[pin]: https://www.data.gov.in/resource/all-india-pincode-directory-till-last-month
[m06]: ../../supabase/migrations/20261031000006_commerce.sql
[m10]: ../../supabase/migrations/20261031000010_settings_ops.sql
