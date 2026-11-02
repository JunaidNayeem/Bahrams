-- Inventory per SKU and location. Quantities are numeric so fabric can be held in metres
-- (0.5 m steps); pieces are whole numbers. available = on_hand - reserved.

create table public.stock_locations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_-]+$'),
  name text not null,
  type public.stock_location_type not null,
  address text,
  -- Reservations draw from the default location first.
  is_default boolean not null default false,
  -- Stock "with_weaver" is visible to staff but not sellable until received.
  sellable boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index stock_locations_one_default on public.stock_locations ((true)) where is_default;
create trigger stock_locations_set_updated_at before update on public.stock_locations
  for each row execute function public.set_updated_at();

create table public.inventory_levels (
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  location_id uuid not null references public.stock_locations (id) on delete restrict,
  on_hand numeric(10, 2) not null default 0 check (on_hand >= 0),
  reserved numeric(10, 2) not null default 0 check (reserved >= 0),
  low_stock_threshold numeric(10, 2),
  updated_at timestamptz not null default now(),
  primary key (variant_id, location_id),
  constraint inventory_reserved_within_on_hand check (reserved <= on_hand)
);
create index inventory_levels_location_idx on public.inventory_levels (location_id);
create trigger inventory_levels_set_updated_at before update on public.inventory_levels
  for each row execute function public.set_updated_at();

-- Every stock movement with a reason. Manual adjustments go through apply_stock_adjustment();
-- 'sold' rows are written by commit_reservation().
create table public.stock_adjustments (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  location_id uuid not null references public.stock_locations (id) on delete restrict,
  delta numeric(10, 2) not null check (delta <> 0),
  reason public.stock_adjustment_reason not null,
  note text,
  order_id uuid, -- FK added in 0006
  return_id uuid, -- FK added in 0006
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index stock_adjustments_variant_idx on public.stock_adjustments (variant_id, created_at desc);

-- Checkout-time holds. checkout_id is the pending order's id (the checkout creates the order row
-- in pending_payment / awaiting_cod_confirmation and reserves against it).
create table public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  location_id uuid not null references public.stock_locations (id) on delete restrict,
  quantity numeric(10, 2) not null check (quantity > 0),
  status public.reservation_status not null default 'active',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  committed_at timestamptz,
  released_at timestamptz
);
create index stock_reservations_checkout_idx on public.stock_reservations (checkout_id);
create index stock_reservations_active_expiry_idx on public.stock_reservations (expires_at)
  where status = 'active';
