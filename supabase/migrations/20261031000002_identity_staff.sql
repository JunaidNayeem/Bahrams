-- Customers (shoppers, including guests), addresses, staff and the role helpers RLS depends on.

-- One row per shopper. Guest orders create a row with user_id null; when that email later signs
-- in with OTP, handle_new_user() links the existing row instead of creating a duplicate.
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  email extensions.citext unique,
  phone text,
  full_name text,
  gstin text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z0-9]{13}$'),
  business_name text,
  tags text[] not null default '{}', -- VIP, boutique, wholesale
  accepts_whatsapp_updates boolean not null default false, -- transactional order updates only
  deleted_at timestamptz, -- DPDP erasure: row anonymised, kept for tax records of past orders
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_contact_present check (email is not null or phone is not null or deleted_at is not null)
);
create index customers_tags_idx on public.customers using gin (tags);
create index customers_phone_idx on public.customers (phone);
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  label text, -- "Home", "Office"
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  landmark text,
  city text not null,
  state text not null,
  state_code text, -- GST state code, e.g. '10' for Bihar
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  country text not null default 'IN',
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_customer_idx on public.addresses (customer_id);
create unique index addresses_one_default_shipping on public.addresses (customer_id)
  where is_default_shipping;
create trigger addresses_set_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index customer_notes_customer_idx on public.customer_notes (customer_id, created_at desc);

create table public.staff_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.staff_role not null,
  active boolean not null default true,
  display_name text not null,
  email extensions.citext not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger staff_members_set_updated_at before update on public.staff_members
  for each row execute function public.set_updated_at();

-- Role helpers. SECURITY DEFINER so policies can consult staff_members without granting shoppers
-- read access to it; fixed empty search_path so a caller cannot shadow objects.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_members s
    where s.user_id = (select auth.uid()) and s.active
  );
$$;

create or replace function public.has_staff_role(variadic p_roles public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_members s
    where s.user_id = (select auth.uid()) and s.active and s.role = any (p_roles)
  );
$$;

create or replace function public.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select s.role from public.staff_members s
  where s.user_id = (select auth.uid()) and s.active;
$$;

create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id from public.customers c where c.user_id = (select auth.uid());
$$;

-- Link or create the customer row whenever an auth user is created (OTP sign-up).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null and new.phone is null then
    return new;
  end if;

  update public.customers
     set user_id = new.id, updated_at = now()
   where user_id is null and new.email is not null and email = new.email::extensions.citext;

  if not found then
    insert into public.customers (user_id, email, phone, full_name)
    values (new.id, new.email, new.phone, new.raw_user_meta_data ->> 'full_name')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
