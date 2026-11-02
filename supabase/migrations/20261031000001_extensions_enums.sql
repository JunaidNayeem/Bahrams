-- Extensions and shared enums.
-- Every enum here mirrors src/lib/domain/enums.ts exactly (same values, same order).
-- Change both together; src/lib/db/enums.test.ts fails if they drift.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_cron;

create type public.product_kind as enum (
  'saree', 'fabric', 'stole_dupatta', 'dress_material', 'kurta_fabric', 'home_furnishing'
);

create type public.fibre as enum (
  'tussar', 'ghicha', 'matka', 'raw_silk', 'mulberry', 'eri', 'noil', 'cotton_silk', 'linen',
  'cotton', 'blend'
);

create type public.occasion as enum ('office', 'festive', 'wedding', 'puja', 'gifting');

create type public.sell_unit as enum ('piece', 'metre');

create type public.publish_status as enum ('draft', 'scheduled', 'published', 'archived');

create type public.order_status as enum (
  'pending_payment', 'awaiting_cod_confirmation', 'confirmed', 'packed', 'shipped',
  'out_for_delivery', 'delivery_failed', 'delivered', 'rto', 'return_requested', 'returned',
  'cancelled'
);

create type public.payment_method as enum ('upi', 'card', 'netbanking', 'wallet', 'emi', 'cod');

create type public.payment_status as enum (
  'pending', 'authorized', 'captured', 'failed', 'refund_pending', 'refunded', 'partially_refunded'
);

create type public.reservation_status as enum ('active', 'committed', 'released', 'expired');

create type public.stock_location_type as enum ('shop', 'warehouse', 'with_weaver');

create type public.stock_adjustment_reason as enum (
  'received', 'sold', 'returned_restock', 'damaged_write_off', 'audit_correction', 'transfer',
  'photoshoot'
);

create type public.return_status as enum (
  'requested', 'approved', 'rejected', 'pickup_scheduled', 'received', 'qc_passed', 'qc_failed',
  'refunded', 'store_credit_issued', 'exchanged'
);

create type public.return_resolution as enum ('exchange', 'store_credit', 'refund_to_source');

create type public.staff_role as enum (
  'owner', 'manager', 'catalogue_editor', 'fulfilment', 'support', 'accountant'
);

create type public.coupon_type as enum ('percentage', 'flat', 'free_shipping');

create type public.review_status as enum ('pending', 'approved', 'rejected');

create type public.consent_purpose as enum (
  'order_processing', 'marketing_email', 'marketing_whatsapp', 'marketing_sms', 'analytics'
);

create type public.grievance_status as enum ('received', 'acknowledged', 'in_progress', 'resolved');

-- Generic updated_at maintenance, attached per table in later migrations.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Indian financial year label for a timestamp, evaluated in IST: 2026-04-01 .. 2027-03-31 -> '2026-27'.
create or replace function public.financial_year_label(p_at timestamptz default now())
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when extract(month from (p_at at time zone 'Asia/Kolkata')) >= 4
      then to_char(p_at at time zone 'Asia/Kolkata', 'YYYY') || '-'
        || to_char((p_at at time zone 'Asia/Kolkata') + interval '1 year', 'YY')
    else to_char((p_at at time zone 'Asia/Kolkata') - interval '1 year', 'YYYY') || '-'
        || to_char(p_at at time zone 'Asia/Kolkata', 'YY')
  end;
$$;
