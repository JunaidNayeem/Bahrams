-- Row Level Security smoke checks. Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(26);

-- Ground truth read as the superuser, before switching roles (the seed's demo data grows over time).
create temporary table expected as select (select count(*)::int from public.orders) as orders;
grant select on expected to anon, authenticated;

-- Helpers to act as a given audience for the rest of the transaction.
create function pg_temp.act_as_anon() returns void language sql as $$
  select set_config('request.jwt.claims', '{"role": "anon"}', true);
  set local role anon;
$$;
create function pg_temp.act_as(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-------------------------------------------------------------------------------
-- Anonymous visitor
-------------------------------------------------------------------------------
select pg_temp.act_as_anon();

select is((select count(*)::int from public.products where slug = 'tussar-saree-unreleased-draft'), 0,
  'anon cannot read a draft product');
select ok((select count(*) from public.products) > 10, 'anon reads published products');
select is((select count(*)::int from public.product_variants where sku = 'BS-DRF-0010'), 0,
  'anon cannot read variants of a draft product');
select is((select count(*)::int from public.reviews where status <> 'approved'), 0,
  'anon sees approved reviews only');
select is((select count(*)::int from public.orders), 0, 'anon cannot read orders');
select is((select count(*)::int from public.customers), 0, 'anon cannot read customers');
select is((select count(*)::int from public.inventory_levels), 0, 'anon cannot read raw inventory');
select is((select count(*)::int from public.settings where not is_public), 0, 'anon reads public settings only');
select is((select count(*)::int from public.coupons), 0, 'anon cannot list coupon codes');
select throws_ok(
  $$ insert into public.products (slug, title, kind, primary_fibre, composition, hsn_code)
     values ('x-test', 'X', 'saree', 'tussar', 'x', '5007') $$,
  '42501', null, 'anon cannot create products'
);
select throws_ok(
  $$ select public.reserve_stock(gen_random_uuid(), '[]'::jsonb) $$,
  '42501', null, 'anon cannot call reserve_stock'
);
select lives_ok(
  $$ insert into public.grievances (name, email, subject, description)
     values ('Test Shopper', 'test@example.com', 'Late delivery', 'My order has not arrived.') $$,
  'anon can lodge a grievance'
);
reset role;
select ok(
  (select ack_due_at between now() + interval '47 hours' and now() + interval '49 hours'
          and resolve_due_at >= now() + interval '28 days'
     from public.grievances where email = 'test@example.com'),
  'grievance gets 48-hour acknowledgement and one-month resolution deadlines'
);

-------------------------------------------------------------------------------
-- Shopper (Asha owns BS100001; Vikram owns BS100002)
-------------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-4000-a000-000000000101');

select is((select array_agg(order_number) from public.orders), array['BS100001'],
  'shopper sees only her own order');
select is((select count(*)::int from public.orders where order_number = 'BS100002'), 0,
  'shopper cannot read another shopper''s order');
select ok(
  (select count(*) from public.order_items) > 0
  and not exists (
    select 1 from public.order_items oi
    where oi.order_id not in (select id from public.orders where order_number = 'BS100001')
  ),
  'shopper sees only her own order lines'
);
select is_empty(
  $$ update public.orders set customer_note = 'changed' returning id $$,
  'shopper cannot edit orders'
);
select throws_ok(
  $$ update public.customers set tags = '{VIP,wholesale}' where email = 'asha@shopper.local' $$,
  '42501', null, 'shopper cannot tag herself'
);
select lives_ok(
  $$ insert into public.consent_events (user_id, purpose, granted, source, notice_version)
     values ('00000000-0000-4000-a000-000000000101', 'marketing_email', true, 'account', '2026-10-draft') $$,
  'shopper records a consent'
);
select throws_ok(
  $$ update public.consent_events set granted = false where user_id = '00000000-0000-4000-a000-000000000101' $$,
  '42501', null, 'consent log is append-only'
);
reset role;

-------------------------------------------------------------------------------
-- Staff
-------------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-4000-a000-000000000002'); -- fulfilment

select is((select count(*)::int from public.orders), (select orders from expected), 'fulfilment staff read all orders');
select is_empty(
  $$ update public.products set title = 'Renamed' where slug = 'raw-silk-saree-mustard' returning id $$,
  'fulfilment staff cannot edit the catalogue'
);
select throws_ok(
  $$ insert into public.coupons (code, type, amount_paise) values ('HACK100', 'flat', 10000) $$,
  '42501', null, 'fulfilment staff cannot create coupons'
);
reset role;

select pg_temp.act_as('00000000-0000-4000-a000-000000000001'); -- owner

select isnt_empty(
  $$ update public.products set subtitle = 'Updated by owner' where slug = 'raw-silk-saree-mustard' returning id $$,
  'owner can edit the catalogue'
);
select throws_ok(
  $$ delete from public.audit_log $$,
  '42501', null, 'audit log cannot be deleted, even by the owner'
);
select throws_ok(
  $$ update public.inventory_levels set on_hand = on_hand + 5 $$,
  '42501', null, 'stock counts change only through apply_stock_adjustment()'
);
reset role;

select * from finish();
rollback;
