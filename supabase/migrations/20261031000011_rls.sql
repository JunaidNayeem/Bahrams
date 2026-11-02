-- Row Level Security for every table in public.
--
-- Audiences:
--   anon / any shopper: published catalogue and CMS rows, approved reviews, public settings.
--   signed-in shopper:  their own customer row, addresses, carts, wishlist, orders, consents,
--                       returns, reviews, data requests and grievances.
--   staff:              read everything operational; writes gated by role, mirroring
--                       src/lib/auth/capabilities.ts:
--     catalogue / content:   owner, manager, catalogue_editor
--     inventory:             owner, manager, catalogue_editor, fulfilment
--     orders (status, notes):owner, manager, fulfilment, support
--     shipments:             owner, manager, fulfilment
--     returns:               owner, manager, fulfilment, support
--     finance (payments, refunds, invoices, gift cards): owner, manager, accountant
--     customers:             owner, manager, support
--     reviews moderation:    owner, manager, catalogue_editor, support
--     promotions:            owner, manager
--     compliance inbox:      owner, manager, support
--     settings:              owner, manager      staff accounts: owner
--     audit log (read):      owner, manager, accountant
--   service_role bypasses RLS (webhooks, cron, guest checkout in trusted server code).
--
-- Append-only tables (consent_events, audit_log, label_usage_log, stock_adjustments,
-- order_status_history, price_history) have no update/delete policies and those privileges are
-- revoked from anon and authenticated.

do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

revoke update, delete, truncate on
  public.consent_events, public.audit_log, public.label_usage_log, public.stock_adjustments,
  public.order_status_history, public.price_history
from anon, authenticated;

-- Shoppers may never write these directly; only staff (via policies) or trusted server code.
revoke insert, update, delete, truncate on public.document_sequences, public.webhook_events
from anon, authenticated;

-------------------------------------------------------------------------------
-- Identity
-------------------------------------------------------------------------------
create policy customers_select_own on public.customers for select to authenticated
  using (user_id = (select auth.uid()));
create policy customers_update_own on public.customers for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy customers_select_staff on public.customers for select to authenticated
  using ((select public.is_staff()));
create policy customers_insert_staff on public.customers for insert to authenticated
  with check ((select public.has_staff_role('owner', 'manager', 'support')));
create policy customers_update_staff on public.customers for update to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support')))
  with check ((select public.has_staff_role('owner', 'manager', 'support')));
create policy customers_delete_owner on public.customers for delete to authenticated
  using ((select public.has_staff_role('owner')));

-- Shoppers can edit their name/phone/preferences but not link, tag or erase themselves.
create or replace function public.guard_customer_self_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and not public.is_staff() then
    if new.user_id is distinct from old.user_id
      or new.email is distinct from old.email
      or new.tags is distinct from old.tags
      or new.deleted_at is distinct from old.deleted_at then
      raise exception 'customers: shoppers may only update name, phone and preferences'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger customers_guard_self_update before update on public.customers
  for each row execute function public.guard_customer_self_update();

create policy addresses_own on public.addresses for all to authenticated
  using (customer_id = (select public.current_customer_id()))
  with check (customer_id = (select public.current_customer_id()));
create policy addresses_select_staff on public.addresses for select to authenticated
  using ((select public.is_staff()));
create policy addresses_write_staff on public.addresses for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support', 'fulfilment')))
  with check ((select public.has_staff_role('owner', 'manager', 'support', 'fulfilment')));

create policy customer_notes_select_staff on public.customer_notes for select to authenticated
  using ((select public.is_staff()));
create policy customer_notes_insert_staff on public.customer_notes for insert to authenticated
  with check ((select public.is_staff()) and author_id = (select auth.uid()));
create policy customer_notes_delete_manager on public.customer_notes for delete to authenticated
  using ((select public.has_staff_role('owner', 'manager')));

create policy staff_members_select_self on public.staff_members for select to authenticated
  using (user_id = (select auth.uid()));
create policy staff_members_select_staff on public.staff_members for select to authenticated
  using ((select public.is_staff()));
create policy staff_members_write_owner on public.staff_members for all to authenticated
  using ((select public.has_staff_role('owner')))
  with check ((select public.has_staff_role('owner')));

-------------------------------------------------------------------------------
-- Catalogue
-------------------------------------------------------------------------------
create policy weavers_select_live on public.weavers for select to anon, authenticated
  using (public.is_live(status, scheduled_at));
create policy weavers_select_staff on public.weavers for select to authenticated
  using ((select public.is_staff()));
create policy weavers_write_catalogue on public.weavers for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy looms_select_public on public.looms for select to anon, authenticated
  using (active);
create policy looms_select_staff on public.looms for select to authenticated
  using ((select public.is_staff()));
create policy looms_write_catalogue on public.looms for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy products_select_live on public.products for select to anon, authenticated
  using (public.is_live(status, scheduled_at));
create policy products_select_staff on public.products for select to authenticated
  using ((select public.is_staff()));
create policy products_write_catalogue on public.products for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy product_variants_select_live on public.product_variants for select to anon, authenticated
  using (active and exists (
    select 1 from public.products p
    where p.id = product_id and public.is_live(p.status, p.scheduled_at)
  ));
create policy product_variants_select_staff on public.product_variants for select to authenticated
  using ((select public.is_staff()));
create policy product_variants_write_catalogue on public.product_variants for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy variant_price_tiers_select_live on public.variant_price_tiers for select to anon, authenticated
  using (exists (
    select 1 from public.product_variants v join public.products p on p.id = v.product_id
    where v.id = variant_id and v.active and public.is_live(p.status, p.scheduled_at)
  ));
create policy variant_price_tiers_select_staff on public.variant_price_tiers for select to authenticated
  using ((select public.is_staff()));
create policy variant_price_tiers_write_catalogue on public.variant_price_tiers for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

-- Price history is public for live products: it is the evidence behind any "prior price".
create policy price_history_select_live on public.price_history for select to anon, authenticated
  using (exists (
    select 1 from public.product_variants v join public.products p on p.id = v.product_id
    where v.id = variant_id and public.is_live(p.status, p.scheduled_at)
  ));
create policy price_history_select_staff on public.price_history for select to authenticated
  using ((select public.is_staff()));

create policy product_media_select_live on public.product_media for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and public.is_live(p.status, p.scheduled_at)
  ));
create policy product_media_select_staff on public.product_media for select to authenticated
  using ((select public.is_staff()));
create policy product_media_write_catalogue on public.product_media for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy media_assets_select_public on public.media_assets for select to anon, authenticated
  using (bucket in ('cms-media', 'product-media'));
create policy media_assets_write_content on public.media_assets for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy collections_select_live on public.collections for select to anon, authenticated
  using (public.is_live(status, scheduled_at));
create policy collections_select_staff on public.collections for select to authenticated
  using ((select public.is_staff()));
create policy collections_write_catalogue on public.collections for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy collection_products_select_live on public.collection_products for select to anon, authenticated
  using (
    exists (select 1 from public.collections c where c.id = collection_id and public.is_live(c.status, c.scheduled_at))
    and exists (select 1 from public.products p where p.id = product_id and public.is_live(p.status, p.scheduled_at))
  );
create policy collection_products_select_staff on public.collection_products for select to authenticated
  using ((select public.is_staff()));
create policy collection_products_write_catalogue on public.collection_products for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

-------------------------------------------------------------------------------
-- Authenticity
-------------------------------------------------------------------------------
create policy authenticity_labels_select_live on public.authenticity_labels for select to anon, authenticated
  using (status in ('attached', 'sold') and exists (
    select 1 from public.products p
    where p.id = product_id and public.is_live(p.status, p.scheduled_at)
  ));
create policy authenticity_labels_select_staff on public.authenticity_labels for select to authenticated
  using ((select public.is_staff()));
create policy authenticity_labels_write_catalogue on public.authenticity_labels for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy label_usage_log_select_staff on public.label_usage_log for select to authenticated
  using ((select public.is_staff()));
create policy label_usage_log_insert_staff on public.label_usage_log for insert to authenticated
  with check (
    (select public.has_staff_role('owner', 'manager', 'catalogue_editor', 'fulfilment'))
    and actor_id = (select auth.uid())
  );

-------------------------------------------------------------------------------
-- Inventory (quantities change only through functions; see 0012)
-------------------------------------------------------------------------------
create policy stock_locations_select_staff on public.stock_locations for select to authenticated
  using ((select public.is_staff()));
create policy stock_locations_write_manager on public.stock_locations for all to authenticated
  using ((select public.has_staff_role('owner', 'manager')))
  with check ((select public.has_staff_role('owner', 'manager')));

create policy inventory_levels_select_staff on public.inventory_levels for select to authenticated
  using ((select public.is_staff()));
create policy inventory_levels_insert_inventory on public.inventory_levels for insert to authenticated
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor', 'fulfilment')));
create policy inventory_levels_update_inventory on public.inventory_levels for update to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor', 'fulfilment')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor', 'fulfilment')));

-- Direct edits may set thresholds; stock counts move only through the ledger functions, which run
-- as the function owner rather than as 'authenticated'.
create or replace function public.guard_inventory_direct_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' and (new.on_hand <> 0 or new.reserved <> 0) then
      raise exception 'inventory_levels: use apply_stock_adjustment() to change stock'
        using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and (new.on_hand <> old.on_hand or new.reserved <> old.reserved) then
      raise exception 'inventory_levels: use apply_stock_adjustment() to change stock'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger inventory_levels_guard_direct_write before insert or update on public.inventory_levels
  for each row execute function public.guard_inventory_direct_write();

create policy stock_adjustments_select_staff on public.stock_adjustments for select to authenticated
  using ((select public.is_staff()));
create policy stock_reservations_select_staff on public.stock_reservations for select to authenticated
  using ((select public.is_staff()));

-------------------------------------------------------------------------------
-- Carts and wishlist
-------------------------------------------------------------------------------
create policy carts_own on public.carts for all to authenticated
  using (customer_id = (select public.current_customer_id()))
  with check (customer_id = (select public.current_customer_id()));
create policy carts_select_staff on public.carts for select to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'accountant')));

create policy cart_items_own on public.cart_items for all to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_id and c.customer_id = (select public.current_customer_id())
  ))
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_id and c.customer_id = (select public.current_customer_id())
  ));
create policy cart_items_select_staff on public.cart_items for select to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'accountant')));

create policy wishlist_items_own on public.wishlist_items for all to authenticated
  using (customer_id = (select public.current_customer_id()))
  with check (customer_id = (select public.current_customer_id()));
create policy wishlist_items_select_staff on public.wishlist_items for select to authenticated
  using ((select public.is_staff()));

-------------------------------------------------------------------------------
-- Orders (shoppers read their own; orders are created by trusted server code or staff)
-------------------------------------------------------------------------------
create or replace function public.owns_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = p_order_id and c.user_id = (select auth.uid())
  );
$$;

create policy orders_select_own on public.orders for select to authenticated
  using (customer_id = (select public.current_customer_id()));
create policy orders_select_staff on public.orders for select to authenticated
  using ((select public.is_staff()));
create policy orders_insert_staff on public.orders for insert to authenticated
  with check (
    (select public.has_staff_role('owner', 'manager', 'support'))
    and source in ('phone', 'manual')
  );
create policy orders_update_staff on public.orders for update to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'fulfilment', 'support')))
  with check ((select public.has_staff_role('owner', 'manager', 'fulfilment', 'support')));

create policy order_items_select_own on public.order_items for select to authenticated
  using ((select public.owns_order(order_id)));
create policy order_items_select_staff on public.order_items for select to authenticated
  using ((select public.is_staff()));
create policy order_items_write_staff on public.order_items for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support')))
  with check ((select public.has_staff_role('owner', 'manager', 'support')));

create policy order_status_history_select_own on public.order_status_history for select to authenticated
  using ((select public.owns_order(order_id)));
create policy order_status_history_select_staff on public.order_status_history for select to authenticated
  using ((select public.is_staff()));

create policy order_notes_select_own on public.order_notes for select to authenticated
  using (customer_visible and (select public.owns_order(order_id)));
create policy order_notes_select_staff on public.order_notes for select to authenticated
  using ((select public.is_staff()));
create policy order_notes_insert_staff on public.order_notes for insert to authenticated
  with check ((select public.is_staff()) and author_id = (select auth.uid()));

create policy payments_select_staff on public.payments for select to authenticated
  using ((select public.is_staff()));
create policy payments_write_finance on public.payments for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'accountant')))
  with check ((select public.has_staff_role('owner', 'manager', 'accountant')));

create policy webhook_events_select_manager on public.webhook_events for select to authenticated
  using ((select public.has_staff_role('owner', 'manager')));

create policy invoices_select_own on public.invoices for select to authenticated
  using ((select public.owns_order(order_id)));
create policy invoices_select_staff on public.invoices for select to authenticated
  using ((select public.is_staff()));
create policy invoices_insert_finance on public.invoices for insert to authenticated
  with check ((select public.has_staff_role('owner', 'manager', 'accountant', 'fulfilment')));
create policy invoices_update_finance on public.invoices for update to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'accountant', 'fulfilment')))
  with check ((select public.has_staff_role('owner', 'manager', 'accountant', 'fulfilment')));

create policy credit_notes_select_own on public.credit_notes for select to authenticated
  using ((select public.owns_order(order_id)));
create policy credit_notes_select_staff on public.credit_notes for select to authenticated
  using ((select public.is_staff()));
create policy credit_notes_insert_finance on public.credit_notes for insert to authenticated
  with check ((select public.has_staff_role('owner', 'manager', 'accountant')));
create policy credit_notes_update_finance on public.credit_notes for update to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'accountant')))
  with check ((select public.has_staff_role('owner', 'manager', 'accountant')));

create policy shipments_select_own on public.shipments for select to authenticated
  using ((select public.owns_order(order_id)));
create policy shipments_select_staff on public.shipments for select to authenticated
  using ((select public.is_staff()));
create policy shipments_write_fulfilment on public.shipments for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'fulfilment')))
  with check ((select public.has_staff_role('owner', 'manager', 'fulfilment')));

create policy shipment_items_select_own on public.shipment_items for select to authenticated
  using (exists (
    select 1 from public.shipments s where s.id = shipment_id and public.owns_order(s.order_id)
  ));
create policy shipment_items_select_staff on public.shipment_items for select to authenticated
  using ((select public.is_staff()));
create policy shipment_items_write_fulfilment on public.shipment_items for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'fulfilment')))
  with check ((select public.has_staff_role('owner', 'manager', 'fulfilment')));

create policy shipment_events_select_own on public.shipment_events for select to authenticated
  using (exists (
    select 1 from public.shipments s where s.id = shipment_id and public.owns_order(s.order_id)
  ));
create policy shipment_events_select_staff on public.shipment_events for select to authenticated
  using ((select public.is_staff()));
create policy shipment_events_write_fulfilment on public.shipment_events for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'fulfilment')))
  with check ((select public.has_staff_role('owner', 'manager', 'fulfilment')));

-- Shoppers can open a return on their own delivered order; staff decide it.
create policy returns_select_own on public.returns for select to authenticated
  using (customer_id = (select public.current_customer_id()));
create policy returns_insert_own on public.returns for insert to authenticated
  with check (
    customer_id = (select public.current_customer_id())
    and status = 'requested'
    and decided_by is null and qc_by is null and received_at is null
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = (select public.current_customer_id())
        and o.status = 'delivered'
    )
  );
create policy returns_select_staff on public.returns for select to authenticated
  using ((select public.is_staff()));
create policy returns_write_staff on public.returns for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'fulfilment', 'support')))
  with check ((select public.has_staff_role('owner', 'manager', 'fulfilment', 'support')));

create policy return_items_select_own on public.return_items for select to authenticated
  using (exists (
    select 1 from public.returns r
    where r.id = return_id and r.customer_id = (select public.current_customer_id())
  ));
create policy return_items_insert_own on public.return_items for insert to authenticated
  with check (
    qc_result is null and disposition is null
    and exists (
      select 1 from public.returns r
      join public.order_items oi on oi.order_id = r.order_id
      where r.id = return_id and oi.id = order_item_id and oi.returnable
        and r.status = 'requested'
        and r.customer_id = (select public.current_customer_id())
    )
  );
create policy return_items_select_staff on public.return_items for select to authenticated
  using ((select public.is_staff()));
create policy return_items_write_staff on public.return_items for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'fulfilment', 'support')))
  with check ((select public.has_staff_role('owner', 'manager', 'fulfilment', 'support')));

create policy refunds_select_own on public.refunds for select to authenticated
  using ((select public.owns_order(order_id)));
create policy refunds_select_staff on public.refunds for select to authenticated
  using ((select public.is_staff()));
create policy refunds_write_finance on public.refunds for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'accountant')))
  with check ((select public.has_staff_role('owner', 'manager', 'accountant')));

-------------------------------------------------------------------------------
-- Promotions and reviews
-------------------------------------------------------------------------------
-- Coupon codes are not listable by shoppers; the checkout validates codes server-side.
create policy coupons_select_staff on public.coupons for select to authenticated
  using ((select public.is_staff()));
create policy coupons_write_promotions on public.coupons for all to authenticated
  using ((select public.has_staff_role('owner', 'manager')))
  with check ((select public.has_staff_role('owner', 'manager')));

create policy coupon_redemptions_select_own on public.coupon_redemptions for select to authenticated
  using (customer_id = (select public.current_customer_id()));
create policy coupon_redemptions_select_staff on public.coupon_redemptions for select to authenticated
  using ((select public.is_staff()));

create policy automatic_offers_select_active on public.automatic_offers for select to anon, authenticated
  using (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy automatic_offers_select_staff on public.automatic_offers for select to authenticated
  using ((select public.is_staff()));
create policy automatic_offers_write_promotions on public.automatic_offers for all to authenticated
  using ((select public.has_staff_role('owner', 'manager')))
  with check ((select public.has_staff_role('owner', 'manager')));

create policy gift_cards_select_own on public.gift_cards for select to authenticated
  using (customer_id = (select public.current_customer_id()));
create policy gift_cards_select_staff on public.gift_cards for select to authenticated
  using ((select public.is_staff()));
create policy gift_cards_write_finance on public.gift_cards for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'accountant', 'support')))
  with check ((select public.has_staff_role('owner', 'manager', 'accountant', 'support')));

create policy gift_card_transactions_select_own on public.gift_card_transactions for select to authenticated
  using (exists (
    select 1 from public.gift_cards g
    where g.id = gift_card_id and g.customer_id = (select public.current_customer_id())
  ));
create policy gift_card_transactions_select_staff on public.gift_card_transactions for select to authenticated
  using ((select public.is_staff()));
create policy gift_card_transactions_insert_finance on public.gift_card_transactions for insert to authenticated
  with check ((select public.has_staff_role('owner', 'manager', 'accountant', 'support')));

create policy reviews_select_approved on public.reviews for select to anon, authenticated
  using (status = 'approved');
create policy reviews_select_own on public.reviews for select to authenticated
  using (customer_id = (select public.current_customer_id()));
create policy reviews_insert_own on public.reviews for insert to authenticated
  with check (
    customer_id = (select public.current_customer_id())
    and status = 'pending' and not verified_purchase
    and reply_body is null and moderated_by is null
  );
create policy reviews_select_staff on public.reviews for select to authenticated
  using ((select public.is_staff()));
create policy reviews_write_moderators on public.reviews for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor', 'support')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor', 'support')));

-------------------------------------------------------------------------------
-- CMS
-------------------------------------------------------------------------------
create policy pages_select_live on public.pages for select to anon, authenticated
  using (public.is_live(status, scheduled_at));
create policy pages_select_staff on public.pages for select to authenticated
  using ((select public.is_staff()));
create policy pages_write_content on public.pages for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

-- Only the current version of a live page is public; earlier versions stay staff-only records.
create policy page_versions_select_current on public.page_versions for select to anon, authenticated
  using (exists (
    select 1 from public.pages p
    where p.current_version_id = page_versions.id and public.is_live(p.status, p.scheduled_at)
  ));
create policy page_versions_select_staff on public.page_versions for select to authenticated
  using ((select public.is_staff()));
create policy page_versions_insert_content on public.page_versions for insert to authenticated
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy banners_select_active on public.banners for select to anon, authenticated
  using (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy banners_select_staff on public.banners for select to authenticated
  using ((select public.is_staff()));
create policy banners_write_content on public.banners for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy home_sections_select_active on public.home_sections for select to anon, authenticated
  using (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy home_sections_select_staff on public.home_sections for select to authenticated
  using ((select public.is_staff()));
create policy home_sections_write_content on public.home_sections for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy navigation_menus_select_public on public.navigation_menus for select to anon, authenticated
  using (true);
create policy navigation_menus_write_content on public.navigation_menus for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy announcements_select_active on public.announcements for select to anon, authenticated
  using (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy announcements_select_staff on public.announcements for select to authenticated
  using ((select public.is_staff()));
create policy announcements_write_content on public.announcements for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy lookbooks_select_live on public.lookbooks for select to anon, authenticated
  using (public.is_live(status, scheduled_at));
create policy lookbooks_select_staff on public.lookbooks for select to authenticated
  using ((select public.is_staff()));
create policy lookbooks_write_content on public.lookbooks for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy lookbook_items_select_live on public.lookbook_items for select to anon, authenticated
  using (exists (
    select 1 from public.lookbooks l where l.id = lookbook_id and public.is_live(l.status, l.scheduled_at)
  ));
create policy lookbook_items_select_staff on public.lookbook_items for select to authenticated
  using ((select public.is_staff()));
create policy lookbook_items_write_content on public.lookbook_items for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy redirects_select_public on public.redirects for select to anon, authenticated
  using (true);
create policy redirects_write_content on public.redirects for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

-------------------------------------------------------------------------------
-- Compliance
-------------------------------------------------------------------------------
create policy consent_events_select_own on public.consent_events for select to authenticated
  using (
    user_id = (select auth.uid())
    or customer_id = (select public.current_customer_id())
  );
create policy consent_events_insert_own on public.consent_events for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (customer_id is null or customer_id = (select public.current_customer_id()))
    and source <> 'admin'
  );
-- Visitors who have not signed in can only record analytics (cookie banner) choices.
create policy consent_events_insert_anon on public.consent_events for insert to anon
  with check (
    user_id is null and customer_id is null and anonymous_id is not null
    and purpose = 'analytics' and source = 'cookie_banner'
  );
create policy consent_events_select_staff on public.consent_events for select to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support')));
create policy consent_events_insert_staff on public.consent_events for insert to authenticated
  with check ((select public.has_staff_role('owner', 'manager', 'support')) and source = 'admin');

create policy data_requests_select_own on public.data_requests for select to authenticated
  using (user_id = (select auth.uid()));
create policy data_requests_insert_own on public.data_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (customer_id is null or customer_id = (select public.current_customer_id()))
    and status = 'received' and response is null and handled_by is null
  );
create policy data_requests_select_staff on public.data_requests for select to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support')));
create policy data_requests_update_staff on public.data_requests for update to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support')))
  with check ((select public.has_staff_role('owner', 'manager', 'support')));

-- Anyone may lodge a grievance (Consumer Protection (E-Commerce) Rules); due dates are forced by trigger.
create policy grievances_insert_public on public.grievances for insert to anon, authenticated
  with check (
    status = 'received' and acknowledged_at is null and resolved_at is null
    and resolution is null and assigned_to is null
    and (customer_id is null or customer_id = (select public.current_customer_id()))
  );
create policy grievances_select_own on public.grievances for select to authenticated
  using (customer_id = (select public.current_customer_id()));
create policy grievances_select_staff on public.grievances for select to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support')));
create policy grievances_update_staff on public.grievances for update to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support')))
  with check ((select public.has_staff_role('owner', 'manager', 'support')));

create policy enquiries_insert_public on public.enquiries for insert to anon, authenticated
  with check (status = 'new' and assigned_to is null);
create policy enquiries_select_staff on public.enquiries for select to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support')));
create policy enquiries_update_staff on public.enquiries for update to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support')))
  with check ((select public.has_staff_role('owner', 'manager', 'support')));

-------------------------------------------------------------------------------
-- Settings and operations
-------------------------------------------------------------------------------
create policy settings_select_public on public.settings for select to anon, authenticated
  using (is_public);
create policy settings_select_staff on public.settings for select to authenticated
  using ((select public.is_staff()));
create policy settings_write_manager on public.settings for all to authenticated
  using ((select public.has_staff_role('owner', 'manager')))
  with check ((select public.has_staff_role('owner', 'manager')));

create policy shipping_zones_select_public on public.shipping_zones for select to anon, authenticated
  using (active);
create policy shipping_zones_select_staff on public.shipping_zones for select to authenticated
  using ((select public.is_staff()));
create policy shipping_zones_write_ops on public.shipping_zones for all to authenticated
  using ((select public.has_staff_role('owner', 'manager')))
  with check ((select public.has_staff_role('owner', 'manager')));

create policy serviceable_pincodes_select_public on public.serviceable_pincodes for select to anon, authenticated
  using (active);
create policy serviceable_pincodes_select_staff on public.serviceable_pincodes for select to authenticated
  using ((select public.is_staff()));
create policy serviceable_pincodes_write_ops on public.serviceable_pincodes for all to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'fulfilment')))
  with check ((select public.has_staff_role('owner', 'manager', 'fulfilment')));

create policy waitlist_insert_public on public.waitlist_subscribers for insert to anon, authenticated
  with check (
    notified_at is null and unsubscribed_at is null
    and (customer_id is null or customer_id = (select public.current_customer_id()))
  );
create policy waitlist_select_staff on public.waitlist_subscribers for select to authenticated
  using ((select public.is_staff()));
create policy waitlist_write_manager on public.waitlist_subscribers for update to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check ((select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy audit_log_insert_staff on public.audit_log for insert to authenticated
  with check ((select public.is_staff()) and actor_id = (select auth.uid()));
create policy audit_log_select_reviewers on public.audit_log for select to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'accountant')));

create policy notification_outbox_select_staff on public.notification_outbox for select to authenticated
  using ((select public.has_staff_role('owner', 'manager', 'support')));

create policy admin_tasks_select_staff on public.admin_tasks for select to authenticated
  using ((select public.is_staff()));
create policy admin_tasks_insert_staff on public.admin_tasks for insert to authenticated
  with check ((select public.is_staff()));
create policy admin_tasks_update_staff on public.admin_tasks for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
