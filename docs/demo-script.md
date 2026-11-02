# Client demo script

A 20-minute walkthrough of the storefront and admin panel, before payments are integrated.
All data is sample data in the hosted Supabase demo project (42 orders, 19 products, 12 customers);
product photos are generated placeholders until the shoot.

## Before the demo

- The day before: open the site once. The Supabase Free plan pauses a project after 7 days idle.
- Undo any test edits made while rehearsing (prices, hidden home sections) from the admin panel.
- Restart `npm run dev` so no cached pages from earlier testing remain.

Store: http://localhost:3020 · Admin: http://localhost:3020/admin
Owner login: `owner@bahramsilks.local` / `bahram-local-dev` (a second tab with
`fulfilment@bahramsilks.local` shows role-based access).

## 1. The store (5 min)

1. **Home** — brand, "Why Bahram" proof strip, shop by fabric, new arrivals, weavers, reviews.
2. **Sarees → Tussar** — filters (fabric, colour), sorting, intro copy and FAQs for SEO.
3. **Natural Gold Tussar Silk Saree with Zari Border** — Silk Mark number with verify link,
   Handloom Mark, Bhagalpur Silk (GI), warp/weft composition, weaver credit, PIN-code delivery
   check (try 812001), WhatsApp "ask about this piece".
4. **Sea Green Cotton-Silk Saree** — no Silk Mark, so no "Pure Silk" badge: claims need records.
5. **Mustard Raw Silk Saree** — a genuine discount, shown because the prior price really was charged.
6. **Fabric → Tussar** — price per metre, 0.5 m steps, bulk prices for boutiques.
7. **Add to bag → Bag** — every charge visible before checkout (no hidden fees).

## 2. Running the business (12 min)

1. **Dashboard** — today, 30-day revenue, prepaid share, COD to confirm, ready to ship, returns.
2. **Orders → COD to confirm** — WhatsApp confirmation link → Confirm → Packed → Shipped (courier + AWB).
   Show the timeline and an internal note. Cancel is impossible after dispatch.
3. **Products → edit Sea Green Cotton-Silk Saree** — change the price, Save, refresh the store
   page: updated instantly. Then type a fake "prior price" of ₹4,999 → refused (genuine prices only).
4. **Products → New product** — create, add a Silk Mark number, publish, upload a photo; open it in the store.
5. **Inventory** — add stock with a reason; try removing more than exists → refused.
6. **Content** — hide/reorder a home section; edit the Returns page and save a new version.
7. **Settings** — change the free-shipping threshold; the store's announcement bar and cart follow.
8. **Reports** — GST summary by HSN (CSV for the CA), sales by fabric, COD reconciliation, KPI targets.
9. **Authenticity, Grievances (48 h / 1 month SLA), Privacy requests, Audit log** — compliance built in.
10. **Fulfilment login** — sees only Dashboard, Inventory, Orders, Shipments, Returns.

## 3. After approval (3 min)

Checkout with Razorpay (UPI first, COD limits, 15-minute holds on one-of-a-kind pieces), shopper
OTP login and accounts, transactional email/WhatsApp, Shiprocket, staff 2FA, then go-live
(see [runbooks/going-live.md](runbooks/going-live.md)). Open client questions:
[open-questions.md](open-questions.md).
