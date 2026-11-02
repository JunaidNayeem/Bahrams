-- Carts, wishlists, orders, payments, refunds, invoices / credit notes, shipments and returns.
-- All money is integer paise (INR). Displayed prices are GST-inclusive, so tax_paise is the GST
-- component contained in the total, not an addition to it.

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  -- Null for guests: guest carts are addressed by id from an httpOnly cookie via trusted server code.
  customer_id uuid references public.customers (id) on delete cascade,
  email extensions.citext, -- captured at checkout for abandoned-cart reporting
  status text not null default 'active'
    check (status in ('active', 'converted', 'abandoned', 'merged')),
  coupon_code extensions.citext,
  gift_wrap boolean not null default false, -- never pre-ticked (Dark Patterns Guidelines 2023)
  gift_message text check (gift_message is null or length(gift_message) <= 300),
  converted_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index carts_customer_idx on public.carts (customer_id) where status = 'active';
create index carts_updated_idx on public.carts (updated_at) where status = 'active';
create trigger carts_set_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity numeric(8, 2) not null check (quantity > 0),
  is_swatch boolean not null default false, -- fabric swatch add-on rather than cut length
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id, is_swatch)
);
create trigger cart_items_set_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

create table public.wishlist_items (
  customer_id uuid not null references public.customers (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

create sequence public.order_number_seq start with 100001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('BS' || nextval('public.order_number_seq')::text),
  customer_id uuid references public.customers (id) on delete set null,
  email extensions.citext,
  phone text,
  status public.order_status not null default 'pending_payment',
  payment_method public.payment_method,
  payment_status public.payment_status not null default 'pending',
  source text not null default 'web' check (source in ('web', 'phone', 'manual')),
  currency text not null default 'INR' check (currency = 'INR'),
  subtotal_paise integer not null check (subtotal_paise >= 0),
  discount_paise integer not null default 0 check (discount_paise >= 0),
  shipping_paise integer not null default 0 check (shipping_paise >= 0),
  cod_fee_paise integer not null default 0 check (cod_fee_paise >= 0),
  gift_wrap_paise integer not null default 0 check (gift_wrap_paise >= 0),
  gift_card_paise integer not null default 0 check (gift_card_paise >= 0),
  tax_paise integer not null default 0 check (tax_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  shipping_address jsonb not null, -- snapshot: { full_name, phone, line1, line2, landmark, city, state, state_code, pincode, country }
  billing_address jsonb,
  place_of_supply_state_code text,
  gstin text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z0-9]{13}$'),
  business_name text,
  coupon_code extensions.citext,
  gift_wrap boolean not null default false,
  gift_message text check (gift_message is null or length(gift_message) <= 300),
  customer_note text,
  razorpay_order_id text unique,
  cart_id uuid references public.carts (id) on delete set null,
  placed_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cod_confirmed_at timestamptz,
  cod_confirmed_by uuid references auth.users (id) on delete set null,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_by uuid references auth.users (id) on delete set null, -- staff for phone/manual orders
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_contact_present check (email is not null or phone is not null),
  constraint orders_total_adds_up check (
    total_paise = subtotal_paise - discount_paise - gift_card_paise + shipping_paise
      + cod_fee_paise + gift_wrap_paise
  ),
  constraint orders_cod_fee_only_for_cod check (cod_fee_paise = 0 or payment_method = 'cod')
);
create index orders_customer_idx on public.orders (customer_id, placed_at desc);
create index orders_status_idx on public.orders (status, placed_at desc);
create index orders_placed_idx on public.orders (placed_at desc);
create index orders_email_idx on public.orders (email);
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.carts
  add constraint carts_converted_order_fk foreign key (converted_order_id)
  references public.orders (id) on delete set null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  -- Snapshots: the order must read the same after the catalogue changes.
  sku text not null,
  title text not null,
  variant_title text,
  colour text,
  sell_unit public.sell_unit not null,
  quantity numeric(8, 2) not null check (quantity > 0),
  is_swatch boolean not null default false,
  unit_price_paise integer not null check (unit_price_paise >= 0),
  compare_at_paise integer,
  discount_paise integer not null default 0 check (discount_paise >= 0),
  line_total_paise integer not null check (line_total_paise >= 0),
  hsn_code text not null,
  gst_rate_bps integer not null,
  tax_paise integer not null default 0,
  silk_mark_label_number text,
  handloom_mark_label_number text,
  gi_eligible boolean not null default false,
  is_one_of_a_kind boolean not null default false,
  returnable boolean not null default true,
  weaver_name text,
  image_path text,
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);

-- Written by the order status trigger; staff can attach a note via set_config('app.status_note').
create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

create table public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null check (length(body) between 1 and 5000),
  customer_visible boolean not null default false,
  created_at timestamptz not null default now()
);
create index order_notes_order_idx on public.order_notes (order_id, created_at);

-- Card data is never stored: only gateway ids and the gateway's own payload.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'razorpay' check (provider in ('razorpay', 'cod', 'manual')),
  method public.payment_method,
  status public.payment_status not null default 'pending',
  amount_paise integer not null check (amount_paise >= 0),
  razorpay_order_id text,
  razorpay_payment_id text unique,
  razorpay_signature text,
  error_code text,
  error_description text,
  raw_payload jsonb,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);
create index payments_razorpay_order_idx on public.payments (razorpay_order_id);
create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- Idempotency log for gateway / courier webhooks: insert on receipt, skip if event_id exists.
create table public.webhook_events (
  id bigint generated always as identity primary key,
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (provider, event_id)
);

create table public.document_sequences (
  series text not null, -- 'invoice' | 'credit_note'
  financial_year text not null, -- '2026-27'
  last_value integer not null default 0,
  primary key (series, financial_year)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete restrict,
  invoice_number text not null unique, -- BS/2026-27/000001 from next_invoice_number()
  financial_year text not null,
  issued_at timestamptz not null default now(),
  seller_gstin text,
  buyer_gstin text,
  buyer_name text,
  place_of_supply_state_code text,
  taxable_paise integer not null check (taxable_paise >= 0),
  cgst_paise integer not null default 0,
  sgst_paise integer not null default 0,
  igst_paise integer not null default 0,
  total_paise integer not null check (total_paise >= 0),
  lines jsonb not null default '[]', -- per-HSN breakup used for the GST HSN summary
  pdf_path text, -- invoices bucket
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete restrict,
  order_id uuid not null references public.orders (id) on delete restrict,
  credit_note_number text not null unique, -- BS-CN/2026-27/000001
  financial_year text not null,
  issued_at timestamptz not null default now(),
  reason text not null,
  taxable_paise integer not null check (taxable_paise >= 0),
  cgst_paise integer not null default 0,
  sgst_paise integer not null default 0,
  igst_paise integer not null default 0,
  total_paise integer not null check (total_paise >= 0),
  lines jsonb not null default '[]',
  pdf_path text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index credit_notes_order_idx on public.credit_notes (order_id);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  courier text, -- booked manually at launch; Shiprocket later
  service text check (service is null or service in ('surface', 'air', 'express')),
  awb text,
  tracking_url text,
  status text not null default 'pending' check (status in (
    'pending', 'label_created', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery',
    'delivered', 'ndr', 'rto_initiated', 'rto_in_transit', 'rto_delivered', 'cancelled'
  )),
  label_path text, -- shipping-labels bucket
  weight_g integer,
  dimensions_cm jsonb, -- { "l": 35, "w": 25, "h": 6 }
  insured_value_paise integer,
  cod_amount_paise integer not null default 0,
  pickup_scheduled_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  ndr_count integer not null default 0,
  ndr_reason text,
  ndr_last_at timestamptz,
  rto_initiated_at timestamptz,
  rto_received_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipments_order_idx on public.shipments (order_id);
create unique index shipments_courier_awb_idx on public.shipments (courier, awb) where awb is not null;
create index shipments_status_idx on public.shipments (status);
create trigger shipments_set_updated_at before update on public.shipments
  for each row execute function public.set_updated_at();

-- Split shipments: which order lines (and how much of each) went in which parcel.
create table public.shipment_items (
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  quantity numeric(8, 2) not null check (quantity > 0),
  primary key (shipment_id, order_item_id)
);

create table public.shipment_events (
  id bigint generated always as identity primary key,
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  status text not null,
  description text,
  location text,
  occurred_at timestamptz not null,
  raw jsonb,
  created_at timestamptz not null default now()
);
create index shipment_events_shipment_idx on public.shipment_events (shipment_id, occurred_at);

create table public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  customer_id uuid references public.customers (id) on delete set null,
  status public.return_status not null default 'requested',
  -- Customer's preference; exchange or store credit is offered first, refund to source on request.
  resolution public.return_resolution not null default 'exchange',
  reason text not null,
  customer_comment text,
  unboxing_video_path text, -- return-evidence bucket
  reverse_courier text,
  reverse_awb text,
  pickup_scheduled_at timestamptz,
  received_at timestamptz,
  qc_notes text,
  qc_by uuid references auth.users (id) on delete set null,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index returns_order_idx on public.returns (order_id);
create index returns_status_idx on public.returns (status, created_at);
create trigger returns_set_updated_at before update on public.returns
  for each row execute function public.set_updated_at();

create table public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete restrict,
  quantity numeric(8, 2) not null check (quantity > 0),
  reason text,
  qc_result text check (qc_result is null or qc_result in ('passed', 'failed')),
  disposition text check (disposition is null or disposition in ('restock', 'write_off')),
  created_at timestamptz not null default now(),
  unique (return_id, order_item_id)
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  payment_id uuid references public.payments (id) on delete set null,
  return_id uuid references public.returns (id) on delete set null,
  amount_paise integer not null check (amount_paise > 0),
  -- Refunds go to source by default; store credit is issued as a gift card.
  method text not null default 'source' check (method in ('source', 'store_credit', 'bank_transfer')),
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  razorpay_refund_id text unique,
  reason text,
  raw_payload jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index refunds_order_idx on public.refunds (order_id);

-- Deferred foreign keys from earlier migrations.
alter table public.label_usage_log
  add constraint label_usage_log_order_fk foreign key (order_id)
  references public.orders (id) on delete set null;
alter table public.stock_adjustments
  add constraint stock_adjustments_order_fk foreign key (order_id)
  references public.orders (id) on delete set null,
  add constraint stock_adjustments_return_fk foreign key (return_id)
  references public.returns (id) on delete set null;
