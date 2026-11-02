-- Authenticity records. A product may carry "Silk Mark" / "Handloom" badges only when a label row
-- exists here (src/lib/domain/claims); GI eligibility is products.gi_eligible.

create table public.authenticity_labels (
  id uuid primary key default gen_random_uuid(),
  label_type text not null check (label_type in ('silk_mark', 'handloom_mark')),
  label_number text not null,
  product_id uuid references public.products (id) on delete set null,
  -- Set for one-of-a-kind pieces; fabric rolls and repeatable designs label at product level.
  variant_id uuid references public.product_variants (id) on delete set null,
  -- in_stock: label received, not yet attached; attached: on the piece; sold: piece shipped;
  -- void: damaged / cancelled label (kept for the audit trail).
  status text not null default 'attached'
    check (status in ('in_stock', 'attached', 'sold', 'void')),
  issued_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (label_type, label_number),
  constraint labels_attached_to_product check (status in ('in_stock', 'void') or product_id is not null)
);
create index authenticity_labels_product_idx on public.authenticity_labels (product_id);
create index authenticity_labels_variant_idx on public.authenticity_labels (variant_id);
create trigger authenticity_labels_set_updated_at before update on public.authenticity_labels
  for each row execute function public.set_updated_at();

-- Label-usage log for Silk Mark / Handloom Mark audits. Append-only.
create table public.label_usage_log (
  id bigint generated always as identity primary key,
  label_id uuid not null references public.authenticity_labels (id) on delete restrict,
  action text not null check (action in ('received', 'attached', 'detached', 'sold', 'returned', 'voided')),
  product_id uuid references public.products (id) on delete set null,
  order_id uuid, -- FK added once orders exist (0006)
  note text,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index label_usage_log_label_idx on public.label_usage_log (label_id, created_at);
