-- Stock reservation rules for one-of-a-kind pieces. Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(22);

create temporary table ids as
select
  (select id from public.product_variants where sku = 'BS-TSR-0001') as piece,     -- qty 1, one of a kind
  (select id from public.product_variants where sku = 'BS-FRS-0011') as fabric,    -- metres
  (select id from public.product_variants where sku = 'BS-DRF-0010') as draft,     -- unpublished
  gen_random_uuid() as checkout_a,
  gen_random_uuid() as checkout_b,
  gen_random_uuid() as checkout_c,
  gen_random_uuid() as checkout_d;

create function pg_temp.available(p_variant uuid) returns numeric language sql as $$
  select available from public.variant_availability(array[p_variant]);
$$;
create function pg_temp.items(p_variant uuid, p_qty numeric) returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('variant_id', p_variant, 'quantity', p_qty));
$$;

-- 1. A qty-1 piece can be held by exactly one checkout.
select is(pg_temp.available((select piece from ids)), 1.00, 'piece starts with 1 available');
select lives_ok(
  format('select public.reserve_stock(%L, %L)', (select checkout_a from ids), pg_temp.items((select piece from ids), 1)),
  'checkout A reserves the piece'
);
select is(pg_temp.available((select piece from ids)), 0.00, 'piece is no longer available');
select throws_ok(
  format('select public.reserve_stock(%L, %L)', (select checkout_b from ids), pg_temp.items((select piece from ids), 1)),
  'P0001', 'insufficient_stock',
  'checkout B cannot reserve the same piece'
);
select is(
  (select count(*)::int from public.stock_reservations where checkout_id = (select checkout_b from ids)),
  0, 'the failed attempt left no partial hold'
);

-- 2. Re-reserving the same checkout replaces its hold instead of doubling it.
select lives_ok(
  format('select public.reserve_stock(%L, %L)', (select checkout_a from ids), pg_temp.items((select piece from ids), 1)),
  'checkout A can re-reserve its own hold'
);
select is(
  (select reserved from public.inventory_levels il
     join public.stock_locations sl on sl.id = il.location_id
    where il.variant_id = (select piece from ids) and sl.code = 'bhagalpur-shop'),
  1.00, 'reserved stays at 1 after re-reserve'
);

-- 3. Holds lapse after 15 minutes and the sweeper frees the piece.
select ok(
  (select bool_and(expires_at between now() + interval '14 minutes' and now() + interval '16 minutes')
     from public.stock_reservations where checkout_id = (select checkout_a from ids) and status = 'active'),
  'holds expire 15 minutes after checkout starts'
);
update public.stock_reservations set expires_at = now() - interval '1 second'
 where checkout_id = (select checkout_a from ids) and status = 'active';
select is(public.release_expired_reservations(), 1, 'sweeper expires one hold');
select is(pg_temp.available((select piece from ids)), 1.00, 'piece is available again after expiry');
-- now() is fixed inside the transaction, so the hold replaced in step 2 shares created_at with
-- this one; count by status instead of ordering by time.
select is(
  (select count(*)::int from public.stock_reservations
    where checkout_id = (select checkout_a from ids) and status = 'expired'),
  1, 'hold is marked expired'
);

-- 4. Commit on payment: stock leaves on_hand, ledger and label record the sale; idempotent.
select lives_ok(
  format('select public.reserve_stock(%L, %L)', (select checkout_b from ids), pg_temp.items((select piece from ids), 1)),
  'checkout B now reserves the piece'
);
select is(public.commit_reservation((select checkout_b from ids)), 1, 'commit takes one hold');
select is(
  (select sum(on_hand) from public.inventory_levels where variant_id = (select piece from ids)),
  0.00, 'on_hand drops to zero'
);
select is(
  (select count(*)::int from public.stock_adjustments
    where variant_id = (select piece from ids) and reason = 'sold' and delta = -1),
  1, 'a sold adjustment is written'
);
select is(
  (select status from public.authenticity_labels where label_number = 'SM-SAMPLE-000101'),
  'sold', 'the Silk Mark label of the piece is marked sold'
);
select is(public.commit_reservation((select checkout_b from ids)), 0, 'second commit is a no-op');
select throws_ok(
  format('select public.reserve_stock(%L, %L)', (select checkout_c from ids), pg_temp.items((select piece from ids), 1)),
  'P0001', 'insufficient_stock',
  'a sold piece can never be reserved again'
);

-- 5. Payment that arrives after the hold lapsed re-acquires stock if it is still there.
select lives_ok(
  format('select public.reserve_stock(%L, %L)', (select checkout_d from ids), pg_temp.items((select fabric from ids), 2.5)),
  'fabric: reserve 2.5 m'
);
update public.stock_reservations set expires_at = now() - interval '1 second'
 where checkout_id = (select checkout_d from ids);
select public.release_expired_reservations();
select is(public.commit_reservation((select checkout_d from ids)), 1, 'late payment re-acquires and commits the lapsed hold');

-- 6. Explicit release and unpublished variants.
select is(public.release_reservation(gen_random_uuid()), 0, 'releasing an unknown checkout is a no-op');
select throws_ok(
  format('select public.reserve_stock(%L, %L)', gen_random_uuid(), pg_temp.items((select draft from ids), 1)),
  'P0001', 'variant_unavailable',
  'draft products cannot be reserved'
);

select * from finish();
rollback;
