-- Catalogue: weavers and looms, products, variants, bulk price tiers, price history, media,
-- collections, and the media library.

-- Published-ness used by RLS and storefront queries. Scheduled rows go live at scheduled_at even
-- before the publish_scheduled cron job flips their status.
create or replace function public.is_live(p_status public.publish_status, p_scheduled_at timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_status = 'published'
      or (p_status = 'scheduled' and p_scheduled_at is not null and p_scheduled_at <= now());
$$;

create table public.weavers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  locality text, -- Nathnagar, Champanagar, Mirzafari, ...
  bio text,
  portrait_path text,
  years_weaving integer check (years_weaving is null or years_weaving >= 0),
  specialities public.fibre[] not null default '{}',
  is_sample boolean not null default false, -- seed data only; never show sample weavers in prod
  status public.publish_status not null default 'draft',
  scheduled_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger weavers_set_updated_at before update on public.weavers
  for each row execute function public.set_updated_at();

create table public.looms (
  id uuid primary key default gen_random_uuid(),
  weaver_id uuid references public.weavers (id) on delete set null,
  code text not null unique, -- registration / Handloom Mark traceability code
  loom_type text, -- pit loom, frame loom, jacquard
  locality text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index looms_weaver_idx on public.looms (weaver_id);
create trigger looms_set_updated_at before update on public.looms
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  subtitle text,
  kind public.product_kind not null,
  primary_fibre public.fibre not null,
  fibre_warp public.fibre,
  fibre_weft public.fibre,
  composition text not null, -- honest label, e.g. "Tussar silk warp, ghicha silk weft"
  weave text, -- plain, jamdani, stripe, dobby...
  zari text, -- null = no zari; otherwise e.g. "tested zari border"
  blouse_included boolean not null default false,
  length_m numeric(5, 2) check (length_m is null or length_m > 0),
  blouse_length_m numeric(4, 2) check (blouse_length_m is null or blouse_length_m > 0),
  width_cm numeric(6, 1) check (width_cm is null or width_cm > 0), -- fabric width
  weight_g integer check (weight_g is null or weight_g > 0),
  care text,
  description text, -- rich text (HTML from Tiptap)
  hsn_code text not null check (hsn_code ~ '^[0-9]{4,8}$'),
  gst_rate_bps integer not null default 500 check (gst_rate_bps between 0 and 2800),
  occasions public.occasion[] not null default '{}',
  tags text[] not null default '{}',
  is_one_of_a_kind boolean not null default false,
  made_to_order boolean not null default false,
  lead_time_days integer check (lead_time_days is null or lead_time_days > 0),
  gi_eligible boolean not null default false, -- only these may say "Bhagalpur Silk (GI)"
  weaver_id uuid references public.weavers (id) on delete set null,
  loom_id uuid references public.looms (id) on delete set null,
  returnable boolean not null default true, -- false for custom-cut fabric and final-sale items
  swatch_available boolean not null default false,
  swatch_price_paise integer check (swatch_price_paise is null or swatch_price_paise >= 0),
  featured_rank integer, -- lower sorts first under "featured"; null = not featured
  status public.publish_status not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  og_image_path text,
  noindex boolean not null default false,
  -- Denormalised for collection filters and price landing pages; maintained by variant triggers.
  price_min_paise integer,
  price_max_paise integer,
  -- Maintained by the review trigger from approved reviews only.
  rating_avg numeric(3, 2),
  rating_count integer not null default 0,
  search_vector tsvector,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_made_to_order_lead_time check (not made_to_order or lead_time_days is not null),
  constraint products_scheduled_has_time check (status <> 'scheduled' or scheduled_at is not null)
);
create index products_kind_status_idx on public.products (kind, status);
create index products_primary_fibre_idx on public.products (primary_fibre);
create index products_occasions_idx on public.products using gin (occasions);
create index products_price_min_idx on public.products (price_min_paise);
create index products_weaver_idx on public.products (weaver_id);
create index products_search_idx on public.products using gin (search_vector);
create index products_title_trgm_idx on public.products using gin (title extensions.gin_trgm_ops);
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  title text, -- e.g. "Mustard, with blouse"
  colour text,
  colour_hex text check (colour_hex is null or colour_hex ~ '^#[0-9a-fA-F]{6}$'),
  sell_unit public.sell_unit not null default 'piece',
  price_paise integer not null check (price_paise > 0),
  compare_at_paise integer check (compare_at_paise is null or compare_at_paise > 0),
  min_qty numeric(8, 2) not null default 1 check (min_qty > 0),
  step_qty numeric(8, 2) not null default 1 check (step_qty > 0),
  max_qty numeric(8, 2) check (max_qty is null or max_qty > 0),
  weight_g integer check (weight_g is null or weight_g > 0),
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Pieces are whole numbers; fabric is bought in 0.5 m steps.
  constraint variants_piece_integer check (
    sell_unit <> 'piece' or (min_qty = trunc(min_qty) and step_qty = trunc(step_qty))
  ),
  constraint variants_metre_half_steps check (
    sell_unit <> 'metre' or (mod(min_qty * 2, 1) = 0 and mod(step_qty * 2, 1) = 0)
  )
);
create index product_variants_product_idx on public.product_variants (product_id, position);
create trigger product_variants_set_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- Bulk prices for fabric (boutiques, designers): unit price once quantity >= min_qty.
create table public.variant_price_tiers (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  min_qty numeric(8, 2) not null check (min_qty > 0),
  price_paise integer not null check (price_paise > 0),
  created_at timestamptz not null default now(),
  unique (variant_id, min_qty)
);

-- Genuine price history: one row per price period, written only by trigger. The storefront may
-- show a compare-at / "prior price" only if it is backed here (src/lib/domain/pricing).
create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  price_paise integer not null check (price_paise > 0),
  compare_at_paise integer,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  changed_by uuid references auth.users (id) on delete set null,
  constraint price_history_period check (effective_to is null or effective_to >= effective_from)
);
create index price_history_variant_idx on public.price_history (variant_id, effective_from desc);
create unique index price_history_one_open_period on public.price_history (variant_id)
  where effective_to is null;

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  kind text not null default 'image' check (kind in ('image', 'video')),
  storage_path text not null, -- path inside the product-media bucket
  poster_path text, -- video poster frame
  alt text not null default '',
  sort integer not null default 0,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now()
);
create index product_media_product_idx on public.product_media (product_id, sort);

-- Shared media library (CMS images, lookbooks, banners). sizes lists generated WebP renditions.
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'cms-media',
  storage_path text not null,
  kind text not null default 'image' check (kind in ('image', 'video', 'document')),
  mime_type text,
  bytes integer check (bytes is null or bytes >= 0),
  width integer,
  height integer,
  alt text not null default '',
  sizes jsonb not null default '[]', -- [{ "width": 800, "path": "..." }]
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

-- Collections map onto the storefront URL tree:
--   section 'root'     -> /<slug>          (sarees, fabric, stoles-dupattas, ...)
--   section 'sarees'   -> /sarees/<slug>
--   section 'fabric'   -> /fabric/<slug>
--   section 'occasion' -> /occasion/<slug>
--   section 'shop'     -> /shop/<slug>     (price bands)
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('root', 'sarees', 'fabric', 'occasion', 'shop')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  path text generated always as (
    case when section = 'root' then '/' || slug else '/' || section || '/' || slug end
  ) stored,
  parent_id uuid references public.collections (id) on delete set null,
  title text not null,
  h1 text,
  intro text, -- SEO intro shown above the grid
  body text, -- longer copy below the grid
  faqs jsonb not null default '[]', -- [{ "question": "...", "answer": "..." }]
  hero_image_path text,
  membership text not null default 'rule' check (membership in ('rule', 'manual')),
  -- Rule keys (all optional, ANDed): kinds[], fibres[], occasions[], price_min_paise,
  -- price_max_paise (exclusive), new_within_days, has_zari, one_of_a_kind, swatch_available,
  -- gi_eligible. Evaluated by products_in_collection().
  rules jsonb not null default '{}',
  default_sort text not null default 'featured'
    check (default_sort in ('featured', 'newest', 'price_asc', 'price_desc')),
  position integer not null default 0,
  status public.publish_status not null default 'draft',
  scheduled_at timestamptz,
  seo_title text,
  seo_description text,
  og_image_path text,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section, slug),
  constraint collections_faqs_array check (jsonb_typeof(faqs) = 'array'),
  constraint collections_rules_object check (jsonb_typeof(rules) = 'object')
);
create unique index collections_path_idx on public.collections (path);
create trigger collections_set_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  position integer not null default 0,
  primary key (collection_id, product_id)
);
create index collection_products_product_idx on public.collection_products (product_id);
