import "server-only";

import type { Fibre, ProductKind, PublishStatus, SellUnit } from "@/lib/domain/enums";
import { createClient } from "@/lib/supabase/server";

import { productMediaUrl } from "../media";

export interface ProductListRow {
  id: string;
  slug: string;
  title: string;
  kind: ProductKind;
  primaryFibre: Fibre;
  status: PublishStatus;
  priceMinPaise: number | null;
  priceMaxPaise: number | null;
  stock: number;
  sellUnit: SellUnit;
  isOneOfAKind: boolean;
  hasSilkMark: boolean;
  thumbnail: string | null;
  updatedAt: string;
}

export interface ProductListFilters {
  q?: string;
  status?: PublishStatus;
  kind?: ProductKind;
}

export async function listAdminProducts(filters: ProductListFilters): Promise<ProductListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      `id, slug, title, kind, primary_fibre, status, price_min_paise, price_max_paise, is_one_of_a_kind, updated_at,
       product_media ( storage_path, sort, kind ),
       product_variants ( sell_unit, inventory_levels ( on_hand, reserved ) ),
       authenticity_labels ( label_type, status )`,
    )
    .order("updated_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.q) query = query.or(`title.ilike.%${filters.q.replace(/[%,()]/g, "")}%,slug.ilike.%${filters.q.replace(/[%,()]/g, "")}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data.map((p) => {
    const thumb = p.product_media.filter((m) => m.kind === "image").sort((a, b) => a.sort - b.sort)[0];
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      kind: p.kind,
      primaryFibre: p.primary_fibre,
      status: p.status,
      priceMinPaise: p.price_min_paise,
      priceMaxPaise: p.price_max_paise,
      stock: p.product_variants.reduce(
        (n, v) => n + v.inventory_levels.reduce((m, l) => m + Number(l.on_hand) - Number(l.reserved), 0),
        0,
      ),
      sellUnit: p.product_variants[0]?.sell_unit ?? "piece",
      isOneOfAKind: p.is_one_of_a_kind,
      hasSilkMark: p.authenticity_labels.some((l) => l.label_type === "silk_mark" && l.status !== "void"),
      thumbnail: thumb ? productMediaUrl(thumb.storage_path) : null,
      updatedAt: p.updated_at,
    };
  });
}

export async function getAdminProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `*,
       product_variants ( *, inventory_levels ( on_hand, reserved, stock_locations ( name ) ) ),
       product_media ( id, storage_path, alt, sort, kind, width, height ),
       authenticity_labels ( id, label_type, label_number, status, variant_id )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

export async function listWeaverOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("weavers").select("id, name, locality").order("name");
  if (error) throw error;
  return data;
}
