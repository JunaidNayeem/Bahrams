# 0003. Reserve one-of-a-kind stock at checkout start, release after 15 minutes

- Status: accepted
- Date: 2026-10-31
- Source: [kickoff brief](../kickoff.md), "Admin panel scope" (order lifecycle) and "Key risks"

## Context and problem statement

Most handloom sarees are unique: a SKU with quantity 1. Fabric is stocked in metres and sold in
0.5 m steps. Two shoppers must never pay for the same saree, yet holding stock for every cart would
lock pieces away from real buyers for days. When do we hold stock, for how long, and what makes the
hold permanent?

## Decision drivers

- Never double-sell a quantity-1 piece (the brief's top inventory risk).
- Do not hold stock for browsers: add-to-cart is not commitment.
- Payment can fail, be abandoned or arrive late via webhook.
- COD orders are not real until confirmed by WhatsApp or phone.
- Vercel Hobby crons run only daily, so expiry cannot depend on Vercel.

## Considered options

1. Reserve at add-to-cart.
2. **Reserve at checkout start, expire after a TTL, commit on capture or COD confirmation.**
3. No reservation; decrement on payment capture and refund the loser.

## Decision outcome

Chosen: **option 2**.

- **Reserve when checkout starts** (the shopper proceeds from cart to checkout). A single Postgres
  function locks the stock rows (`SELECT … FOR UPDATE`), checks that on-hand stock minus active
  reservations covers the request, and inserts a `stock_reservations` row with status `active` and
  an `expires_at` 15 minutes ahead. If any line cannot be reserved, nothing is reserved and the shopper sees
  which piece just sold.
- **Available to sell** everywhere on the storefront is `on_hand - sum(active reservations)`; a
  reserved one-of-a-kind piece shows as "in someone's checkout", not as sold, and returns to sale if
  the hold lapses.
- **Release**: Supabase `pg_cron` runs every minute and moves `active` reservations past `expires_at`
  to `expired`. Cancelling checkout, or a failed payment, moves them to `released` immediately. The
  daily Vercel cron (`/api/cron/nightly`) and `/api/cron/release-reservations` are backstops only.
- **Commit**: on Razorpay payment capture (verified webhook `/api/webhooks/razorpay`, idempotent on
  the payment id) or when staff confirm a COD order, reservations become `committed`, `on_hand` is
  decremented and a `stock_adjustments` row with reason `sold` is written, in one transaction. The
  order moves to `confirmed`.
- **Late capture**: if a payment is captured after its reservation expired and the piece has since
  been reserved by someone else, the order is not confirmed; it is flagged for staff and refunded to
  source automatically. This is rare and logged.
- **COD**: the reservation for an order in `awaiting_cod_confirmation` is extended until the
  confirmation window closes (setting, default 24 hours), because the customer has placed an order,
  not merely started checkout. Unconfirmed orders are cancelled and their stock released.
- Reservation statuses are exactly `RESERVATION_STATUSES` in `src/lib/domain/enums.ts`:
  `active`, `committed`, `released`, `expired`.

### Consequences

- Good: a piece is either available, held for at most 15 minutes, or sold. No oversell by design;
  the database enforces it, not application code.
- Good: shoppers keep carts indefinitely without blocking anyone.
- Bad: a shopper who dawdles on the payment page past 15 minutes can lose the piece. The checkout
  shows the remaining hold time honestly (a real deadline, not a fake timer) and lets them restart.
- Bad: one more scheduled job to monitor; the admin dashboard surfaces stale `active` reservations.

## More information

- Order lifecycle: [architecture.md](../architecture.md#order-lifecycle)
- TTL and COD window are runtime settings in the `settings` table, editable by the owner.
