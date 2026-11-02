-- Compliance: DPDP consent log and data-principal requests, Consumer Protection (E-Commerce)
-- grievances, and the public contact / bulk enquiry inbox.

-- Append-only consent log: one row per grant or withdrawal, per purpose. The current state of a
-- purpose is the latest row (see current_consents()). Never updated or deleted.
create table public.consent_events (
  id bigint generated always as identity primary key,
  customer_id uuid references public.customers (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  -- Cookie id for visitors who have not signed in (analytics consent from the banner).
  anonymous_id uuid,
  email extensions.citext,
  phone text,
  purpose public.consent_purpose not null,
  granted boolean not null,
  source text not null check (source in ('checkout', 'account', 'cookie_banner', 'signup', 'admin', 'import')),
  notice_version text not null, -- version of the privacy notice shown at the time
  user_agent text,
  created_at timestamptz not null default now(),
  constraint consent_events_has_subject check (
    customer_id is not null or user_id is not null or anonymous_id is not null
    or email is not null or phone is not null
  )
);
create index consent_events_customer_idx on public.consent_events (customer_id, purpose, created_at desc);
create index consent_events_user_idx on public.consent_events (user_id, purpose, created_at desc);
create index consent_events_anon_idx on public.consent_events (anonymous_id, purpose, created_at desc);

-- DPDP data-principal rights: access, correction, erasure, nomination, consent withdrawal help.
create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  email extensions.citext not null,
  type text not null check (type in ('access', 'correction', 'erasure', 'nomination')),
  status text not null default 'received'
    check (status in ('received', 'verifying', 'in_progress', 'completed', 'rejected')),
  details text,
  response text,
  -- Internal SLA, not a statutory deadline; adjust once counsel confirms.
  due_at timestamptz not null default now() + interval '30 days',
  handled_by uuid references auth.users (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index data_requests_status_idx on public.data_requests (status, due_at);
create trigger data_requests_set_updated_at before update on public.data_requests
  for each row execute function public.set_updated_at();

create sequence public.grievance_number_seq;

-- Consumer Protection (E-Commerce) Rules: acknowledge within 48 hours, resolve within one month.
create table public.grievances (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default 'GRV-' || lpad(nextval('public.grievance_number_seq')::text, 6, '0'),
  customer_id uuid references public.customers (id) on delete set null,
  name text not null,
  email extensions.citext not null,
  phone text,
  order_id uuid references public.orders (id) on delete set null,
  order_number text,
  category text not null default 'other'
    check (category in ('order', 'delivery', 'payment', 'refund', 'product_quality', 'privacy', 'other')),
  subject text not null,
  description text not null check (length(description) between 1 and 10000),
  status public.grievance_status not null default 'received',
  ack_due_at timestamptz not null default now() + interval '48 hours',
  resolve_due_at timestamptz not null default now() + interval '1 month',
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution text,
  assigned_to uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index grievances_status_idx on public.grievances (status, ack_due_at);
create trigger grievances_set_updated_at before update on public.grievances
  for each row execute function public.set_updated_at();

-- /contact, /bulk-enquiries and "ask about this saree" messages.
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('contact', 'bulk', 'product')),
  name text not null,
  email extensions.citext,
  phone text,
  company text,
  gstin text,
  product_id uuid references public.products (id) on delete set null,
  quantity_note text,
  message text not null check (length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  assigned_to uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enquiries_contact_present check (email is not null or phone is not null)
);
create index enquiries_status_idx on public.enquiries (status, created_at desc);
create trigger enquiries_set_updated_at before update on public.enquiries
  for each row execute function public.set_updated_at();
