-- Promotions (basic MVP: coupons, automatic offers, gift cards) and product reviews.

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code extensions.citext not null unique check (code ~* '^[A-Z0-9_-]{3,32}$'),
  type public.coupon_type not null,
  percent_bps integer check (percent_bps is null or percent_bps between 1 and 10000),
  amount_paise integer check (amount_paise is null or amount_paise > 0),
  max_discount_paise integer check (max_discount_paise is null or max_discount_paise > 0),
  min_order_paise integer not null default 0 check (min_order_paise >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_limit_per_customer integer check (usage_limit_per_customer is null or usage_limit_per_customer > 0),
  times_used integer not null default 0,
  first_order_only boolean not null default false,
  -- Optional scope: { "collection_ids": [...], "product_ids": [...], "kinds": [...] }
  applies_to jsonb not null default '{}',
  description text,
  active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_value_matches_type check (
    (type = 'percentage' and percent_bps is not null and amount_paise is null)
    or (type = 'flat' and amount_paise is not null and percent_bps is null)
    or (type = 'free_shipping' and amount_paise is null and percent_bps is null)
  ),
  constraint coupons_window check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create trigger coupons_set_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete restrict,
  order_id uuid not null references public.orders (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  discount_paise integer not null check (discount_paise >= 0),
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);
create index coupon_redemptions_customer_idx on public.coupon_redemptions (customer_id);

-- Offers applied without a code, e.g. the prepaid incentive or a festive sale. Shown to shoppers
-- upfront on product and cart pages.
create table public.automatic_offers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  customer_message text not null, -- e.g. "Save ₹100 when you pay online"
  type public.coupon_type not null,
  percent_bps integer check (percent_bps is null or percent_bps between 1 and 10000),
  amount_paise integer check (amount_paise is null or amount_paise > 0),
  max_discount_paise integer,
  min_order_paise integer not null default 0,
  prepaid_only boolean not null default false,
  -- Optional scope: { "collection_ids": [...], "product_ids": [...], "kinds": [...] }
  applies_to jsonb not null default '{}',
  priority integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automatic_offers_value_matches_type check (
    (type = 'percentage' and percent_bps is not null and amount_paise is null)
    or (type = 'flat' and amount_paise is not null and percent_bps is null)
    or (type = 'free_shipping' and amount_paise is null and percent_bps is null)
  )
);
create trigger automatic_offers_set_updated_at before update on public.automatic_offers
  for each row execute function public.set_updated_at();

-- Gift cards double as store credit (returns resolved as store_credit issue a card).
create table public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code extensions.citext not null unique,
  initial_paise integer not null check (initial_paise > 0),
  balance_paise integer not null check (balance_paise >= 0),
  issued_reason text not null default 'purchase'
    check (issued_reason in ('purchase', 'store_credit', 'goodwill')),
  customer_id uuid references public.customers (id) on delete set null,
  return_id uuid references public.returns (id) on delete set null,
  expires_at timestamptz,
  active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gift_cards_balance_within_initial check (balance_paise <= initial_paise)
);
create index gift_cards_customer_idx on public.gift_cards (customer_id);
create trigger gift_cards_set_updated_at before update on public.gift_cards
  for each row execute function public.set_updated_at();

create table public.gift_card_transactions (
  id bigint generated always as identity primary key,
  gift_card_id uuid not null references public.gift_cards (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  delta_paise integer not null check (delta_paise <> 0),
  note text,
  created_at timestamptz not null default now()
);
create index gift_card_transactions_card_idx on public.gift_card_transactions (gift_card_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  order_item_id uuid references public.order_items (id) on delete set null,
  author_name text not null,
  author_city text,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null check (length(body) between 1 and 5000),
  photos text[] not null default '{}', -- review-photos bucket paths
  status public.review_status not null default 'pending',
  -- Set only by trusted code / staff after matching a delivered order line.
  verified_purchase boolean not null default false,
  reply_body text,
  replied_at timestamptz,
  replied_by uuid references auth.users (id) on delete set null,
  moderated_by uuid references auth.users (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews (product_id, status, created_at desc);
create unique index reviews_one_per_order_item on public.reviews (order_item_id)
  where order_item_id is not null;
create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();
