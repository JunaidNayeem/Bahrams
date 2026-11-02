-- Storage buckets and object policies.
--   product-media   public   product photos / videos (WebP renditions made with sharp on upload)
--   cms-media       public   banners, lookbooks, weaver portraits, page images
--   review-photos   public   shopper review photos, uploaded under <user id>/...
--   return-evidence private  unboxing videos and damage photos, uploaded under <user id>/...
--   invoices        private  GST invoices and credit notes (served to shoppers via signed URLs)
--   shipping-labels private  courier labels

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-media', 'product-media', true, 20 * 1024 * 1024,
    array['image/webp', 'image/jpeg', 'image/png', 'image/avif', 'video/mp4', 'video/webm']),
  ('cms-media', 'cms-media', true, 20 * 1024 * 1024,
    array['image/webp', 'image/jpeg', 'image/png', 'image/avif', 'image/svg+xml', 'video/mp4', 'video/webm']),
  ('review-photos', 'review-photos', true, 8 * 1024 * 1024,
    array['image/webp', 'image/jpeg', 'image/png', 'image/heic']),
  ('return-evidence', 'return-evidence', false, 50 * 1024 * 1024,
    array['video/mp4', 'video/quicktime', 'video/webm', 'image/webp', 'image/jpeg', 'image/png', 'image/heic']),
  ('invoices', 'invoices', false, 5 * 1024 * 1024, array['application/pdf']),
  ('shipping-labels', 'shipping-labels', false, 5 * 1024 * 1024, array['application/pdf', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve reads through the public URL; these policies cover listing and API reads.
create policy "public media is readable" on storage.objects for select to anon, authenticated
  using (bucket_id in ('product-media', 'cms-media', 'review-photos'));

create policy "catalogue staff manage product media" on storage.objects for all to authenticated
  using (bucket_id = 'product-media' and (select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check (bucket_id = 'product-media' and (select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy "content staff manage cms media" on storage.objects for all to authenticated
  using (bucket_id = 'cms-media' and (select public.has_staff_role('owner', 'manager', 'catalogue_editor')))
  with check (bucket_id = 'cms-media' and (select public.has_staff_role('owner', 'manager', 'catalogue_editor')));

create policy "shoppers upload own review photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "moderators remove review photos" on storage.objects for delete to authenticated
  using (
    bucket_id = 'review-photos'
    and (select public.has_staff_role('owner', 'manager', 'catalogue_editor', 'support'))
  );

create policy "shoppers upload own return evidence" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'return-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "shoppers read own return evidence" on storage.objects for select to authenticated
  using (
    bucket_id = 'return-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "returns staff read return evidence" on storage.objects for select to authenticated
  using (
    bucket_id = 'return-evidence'
    and (select public.has_staff_role('owner', 'manager', 'fulfilment', 'support'))
  );

create policy "staff read invoices" on storage.objects for select to authenticated
  using (bucket_id = 'invoices' and (select public.is_staff()));
create policy "finance staff write invoices" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invoices'
    and (select public.has_staff_role('owner', 'manager', 'accountant', 'fulfilment'))
  );

create policy "fulfilment staff manage shipping labels" on storage.objects for all to authenticated
  using (bucket_id = 'shipping-labels' and (select public.has_staff_role('owner', 'manager', 'fulfilment')))
  with check (bucket_id = 'shipping-labels' and (select public.has_staff_role('owner', 'manager', 'fulfilment')));
