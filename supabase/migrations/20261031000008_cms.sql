-- CMS: versioned pages (legal, help, craft), banners, home sections, navigation menus,
-- announcement bar, lookbooks and redirects. Journal articles are MDX files in the repo.

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  -- Route the page renders at, e.g. 'legal/terms', 'help/shipping', 'our-story'.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$'),
  kind text not null check (kind in ('legal', 'help', 'craft', 'static')),
  title text not null,
  status public.publish_status not null default 'draft',
  scheduled_at timestamptz,
  -- The version shown on the site. Older versions stay for the legal record.
  current_version_id uuid,
  seo_title text,
  seo_description text,
  noindex boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger pages_set_updated_at before update on public.pages
  for each row execute function public.set_updated_at();

create table public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  version integer not null check (version > 0),
  title text not null,
  body_json jsonb, -- Tiptap document (editor source)
  body_html text not null, -- sanitised render
  change_summary text,
  effective_from date, -- legal pages: date the terms take effect
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (page_id, version)
);

alter table public.pages
  add constraint pages_current_version_fk foreign key (current_version_id)
  references public.page_versions (id) on delete set null;

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('home_hero', 'home_secondary', 'collection_top')),
  title text not null,
  subtitle text,
  cta_label text,
  cta_href text,
  image_path text,
  mobile_image_path text,
  alt text not null default '',
  position integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger banners_set_updated_at before update on public.banners
  for each row execute function public.set_updated_at();

create table public.home_sections (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'hero', 'proof_strip', 'shop_by_fabric', 'collection_carousel', 'bestsellers', 'reviews',
    'weaver_story', 'lookbook', 'rich_text', 'instagram'
  )),
  title text,
  subtitle text,
  config jsonb not null default '{}', -- type-specific: { "collection_path": "/sarees/tussar-silk", ... }
  position integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger home_sections_set_updated_at before update on public.home_sections
  for each row execute function public.set_updated_at();

create table public.navigation_menus (
  handle text primary key check (handle ~ '^[a-z0-9_]+$'), -- header, footer_shop, footer_help, ...
  title text not null,
  -- [{ "label": "Sarees", "href": "/sarees", "children": [{ "label": ..., "href": ... }] }]
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array'),
  updated_at timestamptz not null default now()
);
create trigger navigation_menus_set_updated_at before update on public.navigation_menus
  for each row execute function public.set_updated_at();

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null check (length(message) <= 160),
  href text,
  position integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger announcements_set_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();

create table public.lookbooks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  intro text,
  cover_image_path text,
  status public.publish_status not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger lookbooks_set_updated_at before update on public.lookbooks
  for each row execute function public.set_updated_at();

create table public.lookbook_items (
  id uuid primary key default gen_random_uuid(),
  lookbook_id uuid not null references public.lookbooks (id) on delete cascade,
  position integer not null default 0,
  image_path text not null,
  alt text not null default '',
  caption text,
  product_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index lookbook_items_lookbook_idx on public.lookbook_items (lookbook_id, position);

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique check (from_path ~ '^/' and from_path !~ '.+/$'),
  to_path text not null check (to_path ~ '^(/|https://)'),
  status_code smallint not null default 308 check (status_code in (301, 308)),
  hits integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint redirects_not_self check (from_path <> to_path)
);
create trigger redirects_set_updated_at before update on public.redirects
  for each row execute function public.set_updated_at();
