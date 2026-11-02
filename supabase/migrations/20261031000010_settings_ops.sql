-- Settings, shipping zones and serviceable PIN codes, waitlist, audit log, notification outbox
-- and admin tasks.

-- Runtime business settings edited in /admin/settings. is_public rows are readable by anyone
-- (COD limit, fees, legal entity, grievance officer); the rest are staff-only.
create table public.settings (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create trigger settings_set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

create table public.shipping_zones (
  code text primary key check (code ~ '^[a-z0-9_]+$'),
  name text not null,
  standard_rate_paise integer not null check (standard_rate_paise >= 0),
  express_rate_paise integer check (express_rate_paise is null or express_rate_paise >= 0),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger shipping_zones_set_updated_at before update on public.shipping_zones
  for each row execute function public.set_updated_at();

create table public.serviceable_pincodes (
  pincode text primary key check (pincode ~ '^[1-9][0-9]{5}$'),
  city text not null,
  district text,
  state text not null,
  state_code text, -- GST state code
  zone text not null references public.shipping_zones (code) on update cascade,
  cod_available boolean not null default true,
  prepaid_available boolean not null default true,
  est_days_min smallint not null check (est_days_min > 0),
  est_days_max smallint not null,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint pincodes_days_range check (est_days_max >= est_days_min)
);
create index serviceable_pincodes_zone_idx on public.serviceable_pincodes (zone);
create trigger serviceable_pincodes_set_updated_at before update on public.serviceable_pincodes
  for each row execute function public.set_updated_at();

-- "Notify me" for sold-out one-of-a-kind pieces and upcoming collections.
create table public.waitlist_subscribers (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null,
  phone text,
  product_id uuid references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  collection_id uuid references public.collections (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  notified_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint waitlist_has_target check (
    product_id is not null or variant_id is not null or collection_id is not null
  )
);
create unique index waitlist_unique_target on public.waitlist_subscribers (
  email, coalesce(variant_id, product_id, collection_id)
);

-- Append-only audit trail of staff actions. Written by audit triggers and by server actions.
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid, -- no FK: entries must survive staff account deletion
  actor_role public.staff_role,
  action text not null, -- 'insert' | 'update' | 'delete' | domain verbs like 'order.cod_confirmed'
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  context jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);
create index audit_log_created_idx on public.audit_log (created_at desc);

-- Customer messages queued by triggers (order status changes) and sent by the app's worker.
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email', 'whatsapp', 'sms')),
  template text not null, -- e.g. 'order.confirmed', 'order.shipped', 'review.request'
  to_email extensions.citext,
  to_phone text,
  customer_id uuid references public.customers (id) on delete set null,
  order_id uuid references public.orders (id) on delete cascade,
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_error text,
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  constraint outbox_has_recipient check (to_email is not null or to_phone is not null)
);
create index notification_outbox_pending_idx on public.notification_outbox (send_after)
  where status = 'pending';

-- Work queue for staff, created by triggers (order status) and by the app.
create table public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'confirm_cod', 'pack_order', 'handle_ndr', 'qc_rto', 'review_return', ...
  title text not null,
  status text not null default 'open' check (status in ('open', 'done', 'dismissed')),
  priority smallint not null default 2 check (priority between 1 and 3), -- 1 = urgent
  assigned_role public.staff_role,
  assigned_to uuid references auth.users (id) on delete set null,
  order_id uuid references public.orders (id) on delete cascade,
  return_id uuid references public.returns (id) on delete cascade,
  grievance_id uuid references public.grievances (id) on delete cascade,
  -- The order status that created this task; leaving that status closes it automatically.
  order_status public.order_status,
  due_at timestamptz,
  dedupe_key text unique,
  completed_at timestamptz,
  completed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index admin_tasks_open_idx on public.admin_tasks (assigned_role, due_at) where status = 'open';
create index admin_tasks_order_idx on public.admin_tasks (order_id);
create trigger admin_tasks_set_updated_at before update on public.admin_tasks
  for each row execute function public.set_updated_at();
