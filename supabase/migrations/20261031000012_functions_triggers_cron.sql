-- Functions, triggers and scheduled jobs.
--
-- RPCs callable from the app:
--   anon/authenticated: variant_availability, products_in_collection, search_products,
--                       current_consents
--   staff (role-checked inside): apply_stock_adjustment, next_invoice_number,
--                       next_credit_note_number
--   service_role only:  reserve_stock, commit_reservation, release_reservation,
--                       release_expired_reservations, next_order_number,
--                       publish_scheduled_content, purge_stale_data

-------------------------------------------------------------------------------
-- Catalogue triggers
-------------------------------------------------------------------------------
create or replace function public.products_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(new.title, ''))), 'A')
    || setweight(to_tsvector('english', extensions.unaccent('extensions.unaccent'::regdictionary,
         coalesce(new.subtitle, '') || ' ' || replace(new.primary_fibre::text, '_', ' ') || ' '
         || replace(new.kind::text, '_', ' ') || ' ' || coalesce(new.composition, '') || ' '
         || coalesce(new.weave, '') || ' ' || coalesce(new.zari, '')
       )), 'B')
    || setweight(to_tsvector('english', extensions.unaccent('extensions.unaccent'::regdictionary,
         coalesce(regexp_replace(new.description, '<[^>]+>', ' ', 'g'), '') || ' '
         || array_to_string(new.tags, ' ') || ' ' || array_to_string(new.occasions::text[], ' ')
       )), 'C');

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;
create trigger products_before_write before insert or update on public.products
  for each row execute function public.products_before_write();

-- price_history: close the open period and open a new one whenever price or compare-at changes.
create or replace function public.record_price_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.price_paise = old.price_paise
     and new.compare_at_paise is not distinct from old.compare_at_paise then
    return new;
  end if;

  update public.price_history
     set effective_to = now()
   where variant_id = new.id and effective_to is null;

  insert into public.price_history (variant_id, price_paise, compare_at_paise, effective_from, changed_by)
  values (new.id, new.price_paise, new.compare_at_paise, now(), (select auth.uid()));
  return new;
end;
$$;
create trigger product_variants_price_history after insert or update of price_paise, compare_at_paise
  on public.product_variants
  for each row execute function public.record_price_history();

create or replace function public.refresh_product_price_range()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
     set price_min_paise = r.min_price, price_max_paise = r.max_price
    from (
      select min(v.price_paise) as min_price, max(v.price_paise) as max_price
      from public.product_variants v
      where v.product_id = v_product_id and v.active
    ) r
   where p.id = v_product_id;
  if tg_op = 'UPDATE' and old.product_id <> new.product_id then
    update public.products p
       set price_min_paise = r.min_price, price_max_paise = r.max_price
      from (
        select min(v.price_paise) as min_price, max(v.price_paise) as max_price
        from public.product_variants v
        where v.product_id = old.product_id and v.active
      ) r
     where p.id = old.product_id;
  end if;
  return null;
end;
$$;
create trigger product_variants_price_range
  after insert or delete or update of price_paise, active, product_id on public.product_variants
  for each row execute function public.refresh_product_price_range();

create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
     set rating_count = r.cnt, rating_avg = r.avg_rating
    from (
      select count(*)::integer as cnt, round(avg(rv.rating), 2) as avg_rating
      from public.reviews rv
      where rv.product_id = v_product_id and rv.status = 'approved'
    ) r
   where p.id = v_product_id;
  return null;
end;
$$;
create trigger reviews_refresh_rating
  after insert or delete or update of status, rating on public.reviews
  for each row execute function public.refresh_product_rating();

-------------------------------------------------------------------------------
-- Document numbers
-------------------------------------------------------------------------------
create or replace function public.next_order_number()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select 'BS' || nextval('public.order_number_seq')::text;
$$;

-- Gap-free per financial year: the row lock on document_sequences serialises callers.
create or replace function public.next_document_number(p_series text, p_prefix text, p_at timestamptz)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_fy text := public.financial_year_label(p_at);
  v_next integer;
begin
  insert into public.document_sequences as ds (series, financial_year, last_value)
  values (p_series, v_fy, 1)
  on conflict (series, financial_year)
  do update set last_value = ds.last_value + 1
  returning last_value into v_next;
  return p_prefix || '/' || v_fy || '/' || lpad(v_next::text, 6, '0');
end;
$$;

create or replace function public.assert_trusted_or_staff(variadic p_roles public.staff_role[])
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  -- Direct SQL (seed, cron, psql) has no JWT role; the service key carries 'service_role'.
  if coalesce((select auth.role()), 'service_role') = 'service_role' then
    return;
  end if;
  if not exists (
    select 1 from public.staff_members s
    where s.user_id = (select auth.uid()) and s.active and s.role = any (p_roles)
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.next_invoice_number(p_at timestamptz default now())
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_trusted_or_staff('owner', 'manager', 'accountant', 'fulfilment');
  return public.next_document_number('invoice', 'BS', p_at);
end;
$$;

create or replace function public.next_credit_note_number(p_at timestamptz default now())
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_trusted_or_staff('owner', 'manager', 'accountant');
  return public.next_document_number('credit_note', 'BS-CN', p_at);
end;
$$;

-------------------------------------------------------------------------------
-- Stock: reservations and adjustments
-------------------------------------------------------------------------------

-- Reserve stock for a checkout. p_items: [{ "variant_id": uuid, "quantity": number }, ...].
-- All-or-nothing: raises 'insufficient_stock' (detail = JSON with variant_id, requested,
-- available) if any line cannot be held, leaving nothing reserved. Calling again for the same
-- checkout replaces its active holds (cart changed). Holds expire after 15 minutes.
create or replace function public.reserve_stock(p_checkout_id uuid, p_items jsonb)
returns setof public.stock_reservations
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_item record;
  v_level record;
  v_available numeric;
  v_remaining numeric;
  v_take numeric;
  v_expires timestamptz := now() + interval '15 minutes';
  v_request jsonb;
begin
  if p_checkout_id is null then
    raise exception 'checkout_id is required' using errcode = '22004';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'items must be a non-empty array' using errcode = '22023';
  end if;

  -- One line per variant (duplicates summed), ordered by variant_id.
  select jsonb_agg(jsonb_build_object('variant_id', s.variant_id, 'quantity', s.quantity) order by s.variant_id)
    into v_request
  from (
    select (i ->> 'variant_id')::uuid as variant_id, sum((i ->> 'quantity')::numeric) as quantity
    from jsonb_array_elements(p_items) i
    group by 1
  ) s;

  if exists (
    select 1 from jsonb_to_recordset(v_request) as r (variant_id uuid, quantity numeric)
    where r.variant_id is null or r.quantity is null or r.quantity <= 0
  ) then
    raise exception 'each item needs a variant_id and a positive quantity' using errcode = '22023';
  end if;

  -- Unknown, inactive or unpublished variants cannot be reserved.
  select r.variant_id into v_item
  from jsonb_to_recordset(v_request) as r (variant_id uuid, quantity numeric)
  left join public.product_variants v on v.id = r.variant_id and v.active
  left join public.products p on p.id = v.product_id
  where v.id is null or not public.is_live(p.status, p.scheduled_at)
  limit 1;
  if found then
    raise exception 'variant_unavailable'
      using errcode = 'P0001', detail = json_build_object('variant_id', v_item.variant_id)::text;
  end if;

  -- Replace this checkout's existing holds.
  perform public.release_reservation(p_checkout_id);

  -- Lock every candidate inventory row in a stable order to avoid deadlocks between checkouts.
  perform 1
  from public.inventory_levels il
  where il.variant_id in (
    select r.variant_id from jsonb_to_recordset(v_request) as r (variant_id uuid, quantity numeric)
  )
  order by il.variant_id, il.location_id
  for update;

  for v_item in
    select r.variant_id, r.quantity
    from jsonb_to_recordset(v_request) as r (variant_id uuid, quantity numeric)
    order by r.variant_id
  loop
    select coalesce(sum(il.on_hand - il.reserved), 0) into v_available
    from public.inventory_levels il
    join public.stock_locations sl on sl.id = il.location_id
    where il.variant_id = v_item.variant_id and sl.active and sl.sellable;

    if v_available < v_item.quantity then
      raise exception 'insufficient_stock'
        using errcode = 'P0001',
              detail = json_build_object(
                'variant_id', v_item.variant_id,
                'requested', v_item.quantity,
                'available', v_available
              )::text;
    end if;

    v_remaining := v_item.quantity;
    for v_level in
      select il.location_id, il.on_hand - il.reserved as free
      from public.inventory_levels il
      join public.stock_locations sl on sl.id = il.location_id
      where il.variant_id = v_item.variant_id and sl.active and sl.sellable
        and il.on_hand - il.reserved > 0
      order by sl.is_default desc, il.on_hand - il.reserved desc, il.location_id
    loop
      exit when v_remaining <= 0;
      v_take := least(v_level.free, v_remaining);

      update public.inventory_levels
         set reserved = reserved + v_take
       where variant_id = v_item.variant_id and location_id = v_level.location_id;

      insert into public.stock_reservations (checkout_id, variant_id, location_id, quantity, expires_at)
      values (p_checkout_id, v_item.variant_id, v_level.location_id, v_take, v_expires);

      v_remaining := v_remaining - v_take;
    end loop;
  end loop;

  return query
    select * from public.stock_reservations
    where checkout_id = p_checkout_id and status = 'active'
    order by variant_id, location_id;
end;
$$;

-- Release a checkout's active holds (payment failed, cart abandoned, order cancelled).
create or replace function public.release_reservation(p_checkout_id uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
begin
  select array_agg(r.id) into v_ids
  from (
    select id from public.stock_reservations
    where checkout_id = p_checkout_id and status = 'active'
    for update
  ) r;
  if v_ids is null then
    return 0;
  end if;

  perform 1 from public.inventory_levels il
  where (il.variant_id, il.location_id) in (
    select variant_id, location_id from public.stock_reservations where id = any (v_ids)
  )
  order by il.variant_id, il.location_id
  for update;

  update public.inventory_levels il
     set reserved = greatest(il.reserved - x.qty, 0)
    from (
      select variant_id, location_id, sum(quantity) as qty
      from public.stock_reservations where id = any (v_ids)
      group by variant_id, location_id
    ) x
   where il.variant_id = x.variant_id and il.location_id = x.location_id;

  update public.stock_reservations
     set status = 'released', released_at = now()
   where id = any (v_ids);
  return coalesce(array_length(v_ids, 1), 0);
end;
$$;

-- Commit a checkout's holds on payment capture or COD confirmation: stock leaves on_hand, a
-- 'sold' adjustment is written, and one-of-a-kind labels are marked sold.
-- Idempotent (returns 0 if already committed). If the holds lapsed before payment arrived, it
-- tries to take the same quantities again; when that stock is gone it raises
-- 'reservation_lapsed' so the caller can hold the order for a refund or substitute.
create or replace function public.commit_reservation(p_checkout_id uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_order_id uuid;
  v_items jsonb;
begin
  select o.id into v_order_id from public.orders o where o.id = p_checkout_id;

  select array_agg(r.id) into v_ids
  from (
    select id from public.stock_reservations
    where checkout_id = p_checkout_id and status = 'active'
    for update
  ) r;

  if v_ids is null then
    if exists (
      select 1 from public.stock_reservations
      where checkout_id = p_checkout_id and status = 'committed'
    ) then
      return 0;
    end if;

    -- Re-acquire the most recent lapsed batch.
    select jsonb_agg(jsonb_build_object('variant_id', variant_id, 'quantity', qty)) into v_items
    from (
      select variant_id, sum(quantity) as qty
      from public.stock_reservations
      where checkout_id = p_checkout_id and status in ('expired', 'released')
        and released_at = (
          select max(released_at) from public.stock_reservations
          where checkout_id = p_checkout_id and status in ('expired', 'released')
        )
      group by variant_id
    ) lapsed;

    if v_items is null then
      raise exception 'no_reservation'
        using errcode = 'P0001', detail = json_build_object('checkout_id', p_checkout_id)::text;
    end if;

    begin
      perform public.reserve_stock(p_checkout_id, v_items);
    exception when sqlstate 'P0001' then
      raise exception 'reservation_lapsed'
        using errcode = 'P0001', detail = json_build_object('checkout_id', p_checkout_id)::text;
    end;

    select array_agg(id) into v_ids
    from public.stock_reservations
    where checkout_id = p_checkout_id and status = 'active';
  end if;

  perform 1 from public.inventory_levels il
  where (il.variant_id, il.location_id) in (
    select variant_id, location_id from public.stock_reservations where id = any (v_ids)
  )
  order by il.variant_id, il.location_id
  for update;

  update public.inventory_levels il
     set on_hand = il.on_hand - x.qty,
         reserved = il.reserved - x.qty
    from (
      select variant_id, location_id, sum(quantity) as qty
      from public.stock_reservations where id = any (v_ids)
      group by variant_id, location_id
    ) x
   where il.variant_id = x.variant_id and il.location_id = x.location_id;

  insert into public.stock_adjustments (variant_id, location_id, delta, reason, order_id, note)
  select variant_id, location_id, -sum(quantity), 'sold', v_order_id, 'Checkout ' || p_checkout_id
  from public.stock_reservations where id = any (v_ids)
  group by variant_id, location_id;

  update public.stock_reservations
     set status = 'committed', committed_at = now()
   where id = any (v_ids);

  -- One-of-a-kind pieces carry their own label; record it leaving with this order.
  with sold as (
    update public.authenticity_labels l
       set status = 'sold'
     where l.status = 'attached'
       and l.variant_id in (select variant_id from public.stock_reservations where id = any (v_ids))
       and exists (
         select 1 from public.products p where p.id = l.product_id and p.is_one_of_a_kind
       )
    returning l.id, l.product_id
  )
  insert into public.label_usage_log (label_id, action, product_id, order_id, note)
  select id, 'sold', product_id, v_order_id, 'Committed at checkout'
  from sold;

  return coalesce(array_length(v_ids, 1), 0);
end;
$$;

-- Sweep holds older than their expiry. Scheduled every minute by pg_cron and also callable from
-- /api/cron/release-reservations. SKIP LOCKED so it never blocks a checkout mid-commit.
create or replace function public.release_expired_reservations()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
begin
  select array_agg(r.id) into v_ids
  from (
    select id from public.stock_reservations
    where status = 'active' and expires_at <= now()
    order by expires_at
    limit 1000
    for update skip locked
  ) r;
  if v_ids is null then
    return 0;
  end if;

  perform 1 from public.inventory_levels il
  where (il.variant_id, il.location_id) in (
    select variant_id, location_id from public.stock_reservations where id = any (v_ids)
  )
  order by il.variant_id, il.location_id
  for update;

  update public.inventory_levels il
     set reserved = greatest(il.reserved - x.qty, 0)
    from (
      select variant_id, location_id, sum(quantity) as qty
      from public.stock_reservations where id = any (v_ids)
      group by variant_id, location_id
    ) x
   where il.variant_id = x.variant_id and il.location_id = x.location_id;

  update public.stock_reservations
     set status = 'expired', released_at = now()
   where id = any (v_ids);
  return array_length(v_ids, 1);
end;
$$;

-- The only way staff change on-hand stock: locks the level row, writes the ledger entry.
create or replace function public.apply_stock_adjustment(
  p_variant_id uuid,
  p_location_id uuid,
  p_delta numeric,
  p_reason public.stock_adjustment_reason,
  p_note text default null,
  p_return_id uuid default null
)
returns public.inventory_levels
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_level public.inventory_levels;
begin
  perform public.assert_trusted_or_staff('owner', 'manager', 'catalogue_editor', 'fulfilment');
  if p_reason = 'sold' then
    raise exception 'sales are recorded by commit_reservation()' using errcode = '22023';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'delta must be non-zero' using errcode = '22023';
  end if;

  insert into public.inventory_levels (variant_id, location_id)
  values (p_variant_id, p_location_id)
  on conflict (variant_id, location_id) do nothing;

  select * into v_level from public.inventory_levels
  where variant_id = p_variant_id and location_id = p_location_id
  for update;

  if v_level.on_hand + p_delta < v_level.reserved then
    raise exception 'insufficient_stock'
      using errcode = 'P0001',
            detail = json_build_object(
              'variant_id', p_variant_id, 'on_hand', v_level.on_hand, 'reserved', v_level.reserved
            )::text;
  end if;

  update public.inventory_levels
     set on_hand = on_hand + p_delta
   where variant_id = p_variant_id and location_id = p_location_id
  returning * into v_level;

  insert into public.stock_adjustments (variant_id, location_id, delta, reason, note, return_id, actor_id)
  values (p_variant_id, p_location_id, p_delta, p_reason, p_note, p_return_id, (select auth.uid()));

  return v_level;
end;
$$;

-- Sellable stock for live variants (draft products are not disclosed).
create or replace function public.variant_availability(p_variant_ids uuid[])
returns table (variant_id uuid, available numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select v.id, coalesce(sum(il.on_hand - il.reserved) filter (where sl.active and sl.sellable), 0)
  from public.product_variants v
  join public.products p on p.id = v.product_id
  left join public.inventory_levels il on il.variant_id = v.id
  left join public.stock_locations sl on sl.id = il.location_id
  where v.id = any (p_variant_ids) and v.active and public.is_live(p.status, p.scheduled_at)
  group by v.id;
$$;

-------------------------------------------------------------------------------
-- Storefront queries (security invoker: RLS applies)
-------------------------------------------------------------------------------
-- Live products in a collection, by manual membership or by its rules. Callers sort/paginate
-- through PostgREST (.order(), .range()).
create or replace function public.products_in_collection(p_collection_id uuid)
returns setof public.products
language sql
stable
set search_path = ''
as $$
  select p.*
  from public.collections c
  cross join lateral (select c.rules as r) rr
  join public.products p on public.is_live(p.status, p.scheduled_at)
  where c.id = p_collection_id
    and (
      (c.membership = 'manual' and exists (
        select 1 from public.collection_products cp
        where cp.collection_id = c.id and cp.product_id = p.id
      ))
      or (
        c.membership = 'rule'
        and (not (rr.r ? 'kinds') or p.kind::text in (select jsonb_array_elements_text(rr.r -> 'kinds')))
        and (not (rr.r ? 'fibres') or p.primary_fibre::text in (select jsonb_array_elements_text(rr.r -> 'fibres')))
        and (not (rr.r ? 'occasions') or p.occasions::text[] && array(select jsonb_array_elements_text(rr.r -> 'occasions')))
        and (not (rr.r ? 'price_min_paise') or p.price_min_paise >= (rr.r ->> 'price_min_paise')::integer)
        and (not (rr.r ? 'price_max_paise') or p.price_min_paise < (rr.r ->> 'price_max_paise')::integer)
        and (not (rr.r ? 'new_within_days')
             or p.published_at >= now() - make_interval(days => (rr.r ->> 'new_within_days')::integer))
        and (not (rr.r ? 'has_zari') or (p.zari is not null) = (rr.r ->> 'has_zari')::boolean)
        and (not (rr.r ? 'one_of_a_kind') or p.is_one_of_a_kind = (rr.r ->> 'one_of_a_kind')::boolean)
        and (not (rr.r ? 'swatch_available') or p.swatch_available = (rr.r ->> 'swatch_available')::boolean)
        and (not (rr.r ? 'gi_eligible') or p.gi_eligible = (rr.r ->> 'gi_eligible')::boolean)
      )
    );
$$;

-- Full-text search with typo tolerance (pg_trgm) for /search.
create or replace function public.search_products(p_query text, p_limit integer default 24, p_offset integer default 0)
returns setof public.products
language sql
stable
set search_path = public, extensions
as $$
  with q as (
    select websearch_to_tsquery('english', unaccent(p_query)) as tsq, unaccent(p_query) as raw
  )
  select p.*
  from public.products p, q
  where public.is_live(p.status, p.scheduled_at)
    and length(trim(p_query)) > 0
    -- word_similarity matches the query against the closest run of words in the title, so
    -- "tusar sare" still finds tussar sarees.
    and (p.search_vector @@ q.tsq or word_similarity(q.raw, p.title || ' ' || p.composition) > 0.45)
  order by ts_rank(p.search_vector, q.tsq) desc,
    word_similarity(q.raw, p.title || ' ' || p.composition) desc, p.id
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

-- Latest consent state per purpose for the signed-in shopper.
create or replace function public.current_consents()
returns table (purpose public.consent_purpose, granted boolean, recorded_at timestamptz, notice_version text)
language sql
stable
set search_path = ''
as $$
  select distinct on (ce.purpose) ce.purpose, ce.granted, ce.created_at, ce.notice_version
  from public.consent_events ce
  where ce.user_id = (select auth.uid())
     or ce.customer_id = (select public.current_customer_id())
  order by ce.purpose, ce.created_at desc, ce.id desc;
$$;

-------------------------------------------------------------------------------
-- Order lifecycle
-------------------------------------------------------------------------------
create or replace function public.orders_stamp_status_times()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    case new.status
      when 'confirmed' then new.confirmed_at := coalesce(new.confirmed_at, now());
      when 'shipped' then new.shipped_at := coalesce(new.shipped_at, now());
      when 'delivered' then new.delivered_at := coalesce(new.delivered_at, now());
      when 'cancelled' then new.cancelled_at := coalesce(new.cancelled_at, now());
      else null;
    end case;
  end if;
  return new;
end;
$$;
create trigger orders_stamp_status_times before update of status on public.orders
  for each row execute function public.orders_stamp_status_times();

-- Each status change: history row, customer message(s) in the outbox, and an admin task where
-- staff must act. Tasks created for the previous status close automatically. Pass a note with
--   select set_config('app.status_note', 'Called customer, confirmed', true);
-- in the same transaction as the update.
create or replace function public.orders_after_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_history_id bigint;
  v_old public.order_status := case when tg_op = 'UPDATE' then old.status end;
  v_payload jsonb;
  v_task record;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, note)
  values (new.id, v_old, new.status, (select auth.uid()), nullif(current_setting('app.status_note', true), ''))
  returning id into v_history_id;

  if v_old is not null then
    update public.admin_tasks
       set status = 'done', completed_at = now(), completed_by = (select auth.uid())
     where order_id = new.id and order_status = v_old and status = 'open';
  end if;

  if new.status = 'cancelled' then
    perform public.release_reservation(new.id);
  end if;

  -- Abandoned prepaid checkouts stay silent; every later state is messaged.
  if new.status <> 'pending_payment' then
    v_payload := jsonb_build_object(
      'order_number', new.order_number,
      'status', new.status,
      'previous_status', v_old,
      'total_paise', new.total_paise,
      'payment_method', new.payment_method
    );
    if new.email is not null then
      insert into public.notification_outbox (channel, template, to_email, customer_id, order_id, payload, dedupe_key)
      values ('email', 'order.' || new.status, new.email, new.customer_id, new.id, v_payload,
              'order_status:' || v_history_id || ':email')
      on conflict (dedupe_key) do nothing;
    end if;
    if new.phone is not null and new.status in (
      'awaiting_cod_confirmation', 'confirmed', 'shipped', 'out_for_delivery', 'delivery_failed', 'delivered'
    ) then
      insert into public.notification_outbox (channel, template, to_phone, customer_id, order_id, payload, dedupe_key)
      values ('whatsapp', 'order.' || new.status, new.phone, new.customer_id, new.id, v_payload,
              'order_status:' || v_history_id || ':whatsapp')
      on conflict (dedupe_key) do nothing;
    end if;
  end if;

  select * into v_task from (values
    ('awaiting_cod_confirmation'::public.order_status, 'confirm_cod', 'Confirm COD order by WhatsApp or phone', 'support'::public.staff_role, 1, interval '2 hours'),
    ('confirmed', 'pack_order', 'Pack order', 'fulfilment', 2, interval '24 hours'),
    ('packed', 'book_shipment', 'Book courier and print label', 'fulfilment', 2, interval '24 hours'),
    ('shipped', 'track_shipment', 'Track shipment to delivery', 'fulfilment', 3, interval '7 days'),
    ('out_for_delivery', 'track_shipment', 'Out for delivery: watch for NDR', 'fulfilment', 3, interval '1 day'),
    ('delivery_failed', 'handle_ndr', 'Delivery failed: arrange reattempt with customer', 'support', 1, interval '12 hours'),
    ('delivered', 'post_delivery', 'Delivered: reconcile payment and send review request', 'accountant', 3, interval '7 days'),
    ('rto', 'qc_rto', 'RTO received: quality-check before restock', 'fulfilment', 2, interval '48 hours'),
    ('return_requested', 'review_return', 'Review return request', 'support', 1, interval '24 hours'),
    ('returned', 'qc_return', 'Returned piece: quality-check, restock or write off, resolve refund', 'fulfilment', 2, interval '48 hours'),
    ('cancelled', 'review_cancellation', 'Cancelled: refund to source if paid, restock if packed', 'accountant', 2, interval '24 hours')
  ) as t (status, type, title, role, priority, due)
  where t.status = new.status;

  if found and not (new.status = 'cancelled' and new.payment_status not in ('captured', 'authorized', 'partially_refunded')) then
    insert into public.admin_tasks (type, title, assigned_role, priority, order_id, order_status, due_at, dedupe_key)
    values (v_task.type, v_task.title || ' ' || new.order_number, v_task.role, v_task.priority,
            new.id, new.status, now() + v_task.due, 'order_status:' || v_history_id)
    on conflict (dedupe_key) do nothing;
  end if;

  return null;
end;
$$;
create trigger orders_after_status_change after insert or update of status on public.orders
  for each row execute function public.orders_after_status_change();

-------------------------------------------------------------------------------
-- Compliance triggers
-------------------------------------------------------------------------------
-- Statutory clocks start when the grievance is received, whatever the client sent.
create or replace function public.grievances_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := now();
  new.ack_due_at := now() + interval '48 hours';
  new.resolve_due_at := now() + interval '1 month';
  new.reference := 'GRV-' || lpad(nextval('public.grievance_number_seq')::text, 6, '0');
  return new;
end;
$$;
create trigger grievances_before_insert before insert on public.grievances
  for each row execute function public.grievances_before_insert();

create or replace function public.grievances_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_tasks (type, title, assigned_role, priority, grievance_id, due_at, dedupe_key)
  values ('acknowledge_grievance', 'Acknowledge grievance ' || new.reference, 'support', 1,
          new.id, new.ack_due_at, 'grievance_ack:' || new.id);
  insert into public.notification_outbox (channel, template, to_email, customer_id, payload, dedupe_key)
  values ('email', 'grievance.received', new.email, new.customer_id,
          jsonb_build_object('reference', new.reference, 'resolve_due_at', new.resolve_due_at),
          'grievance_received:' || new.id);
  return null;
end;
$$;
create trigger grievances_after_insert after insert on public.grievances
  for each row execute function public.grievances_after_insert();

-------------------------------------------------------------------------------
-- Staff safety
-------------------------------------------------------------------------------
create or replace function public.guard_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner' and old.active
     and (tg_op = 'DELETE' or new.role <> 'owner' or not new.active)
     and not exists (
       select 1 from public.staff_members s
       where s.role = 'owner' and s.active and s.user_id <> old.user_id
     ) then
    raise exception 'cannot remove the last active owner' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger staff_members_guard_last_owner before update or delete on public.staff_members
  for each row execute function public.guard_last_owner();

-------------------------------------------------------------------------------
-- Audit log
-------------------------------------------------------------------------------
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) - 'search_vector' end;
  v_after jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) - 'search_vector' end;
  v_row jsonb := coalesce(v_after, v_before);
begin
  if tg_op = 'UPDATE' and (v_before - 'updated_at') = (v_after - 'updated_at') then
    return null;
  end if;
  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, before, after)
  values (
    (select auth.uid()),
    public.current_staff_role(),
    lower(tg_op),
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'key', v_row ->> 'user_id', v_row ->> 'code', v_row ->> 'handle'),
    v_before,
    v_after
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'products', 'product_variants', 'collections', 'authenticity_labels', 'coupons',
    'automatic_offers', 'gift_cards', 'settings', 'staff_members', 'redirects', 'pages',
    'refunds', 'stock_locations', 'shipping_zones', 'customers'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_row_change()',
      t || '_audit', t
    );
  end loop;
end;
$$;
-- Orders and returns: log edits, not every checkout insert.
create trigger orders_audit after update or delete on public.orders
  for each row execute function public.audit_row_change();
create trigger returns_audit after update or delete on public.returns
  for each row execute function public.audit_row_change();

-------------------------------------------------------------------------------
-- Scheduled maintenance
-------------------------------------------------------------------------------
create or replace function public.publish_scheduled_content()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
  v_n integer;
begin
  update public.products set status = 'published', published_at = coalesce(published_at, scheduled_at)
   where status = 'scheduled' and scheduled_at <= now();
  get diagnostics v_n = row_count; v_count := v_count + v_n;
  update public.collections set status = 'published'
   where status = 'scheduled' and scheduled_at <= now();
  get diagnostics v_n = row_count; v_count := v_count + v_n;
  update public.weavers set status = 'published'
   where status = 'scheduled' and scheduled_at <= now();
  get diagnostics v_n = row_count; v_count := v_count + v_n;
  update public.pages set status = 'published', published_at = coalesce(published_at, scheduled_at)
   where status = 'scheduled' and scheduled_at <= now();
  get diagnostics v_n = row_count; v_count := v_count + v_n;
  update public.lookbooks set status = 'published', published_at = coalesce(published_at, scheduled_at)
   where status = 'scheduled' and scheduled_at <= now();
  get diagnostics v_n = row_count; v_count := v_count + v_n;
  return v_count;
end;
$$;

-- Keeps the Free-plan database small. Legal records (audit_log, consent_events, orders,
-- invoices) are never purged here.
create or replace function public.purge_stale_data()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.carts set status = 'abandoned'
   where status = 'active' and updated_at < now() - interval '14 days';
  delete from public.carts
   where status in ('abandoned', 'merged') and updated_at < now() - interval '90 days';
  delete from public.stock_reservations
   where status <> 'active' and created_at < now() - interval '30 days';
  delete from public.webhook_events
   where processed_at is not null and received_at < now() - interval '90 days';
  delete from public.notification_outbox
   where status in ('sent', 'skipped') and created_at < now() - interval '180 days';
end;
$$;

-------------------------------------------------------------------------------
-- Privileges
-------------------------------------------------------------------------------
revoke execute on function
  public.reserve_stock(uuid, jsonb),
  public.commit_reservation(uuid),
  public.release_reservation(uuid),
  public.release_expired_reservations(),
  public.next_order_number(),
  public.next_document_number(text, text, timestamptz),
  public.publish_scheduled_content(),
  public.purge_stale_data()
from public, anon, authenticated;
grant execute on function
  public.reserve_stock(uuid, jsonb),
  public.commit_reservation(uuid),
  public.release_reservation(uuid),
  public.release_expired_reservations(),
  public.next_order_number(),
  public.publish_scheduled_content(),
  public.purge_stale_data()
to service_role;

revoke execute on function
  public.apply_stock_adjustment(uuid, uuid, numeric, public.stock_adjustment_reason, text, uuid),
  public.next_invoice_number(timestamptz),
  public.next_credit_note_number(timestamptz),
  public.assert_trusted_or_staff(public.staff_role[])
from public, anon;
grant execute on function
  public.apply_stock_adjustment(uuid, uuid, numeric, public.stock_adjustment_reason, text, uuid),
  public.next_invoice_number(timestamptz),
  public.next_credit_note_number(timestamptz)
to authenticated, service_role;

revoke execute on function public.current_consents() from public, anon;
grant execute on function public.current_consents() to authenticated, service_role;

-------------------------------------------------------------------------------
-- pg_cron
-------------------------------------------------------------------------------
select cron.schedule('release-expired-reservations', '* * * * *',
  'select public.release_expired_reservations()');
select cron.schedule('publish-scheduled-content', '*/5 * * * *',
  'select public.publish_scheduled_content()');
-- 03:00 IST
select cron.schedule('purge-stale-data', '30 21 * * *', 'select public.purge_stale_data()');
