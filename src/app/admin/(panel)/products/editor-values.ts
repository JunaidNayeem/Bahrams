import type { EditorValues } from "@/components/admin/product-editor";
import type { AdminProduct } from "@/lib/data/admin/products";

const str = (v: number | string | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

/** Stored description HTML (paragraphs) → editable plain text. */
function htmlToText(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** datetime-local wants "YYYY-MM-DDTHH:mm" in local (IST) time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(Date.parse(iso) + 5.5 * 3600_000);
  return d.toISOString().slice(0, 16);
}

export function emptyEditorValues(): EditorValues {
  return {
    id: "",
    title: "",
    slug: "",
    subtitle: "",
    kind: "saree",
    primaryFibre: "tussar",
    fibreWarp: "",
    fibreWeft: "",
    composition: "",
    weave: "",
    zari: "",
    description: "",
    care: "Dry clean only. Store folded in a cotton pouch, away from damp and direct sun.",
    occasions: [],
    blouseIncluded: true,
    lengthM: "5.5",
    blouseLengthM: "0.8",
    widthCm: "",
    weightG: "",
    isOneOfAKind: false,
    madeToOrder: false,
    leadTimeDays: "",
    giEligible: false,
    weaverId: "",
    returnable: true,
    swatchAvailable: false,
    hsnCode: "5007",
    gstRate: "5",
    status: "draft",
    scheduledAt: "",
    seoTitle: "",
    seoDescription: "",
    noindex: false,
    variants: [
      {
        id: "",
        sku: "",
        title: "",
        colour: "",
        colourHex: "",
        sellUnit: "piece",
        price: "",
        compareAt: "",
        minQty: "1",
        active: true,
        stock: null,
      },
    ],
  };
}

export function toEditorValues(p: AdminProduct): EditorValues {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    subtitle: str(p.subtitle),
    kind: p.kind,
    primaryFibre: p.primary_fibre,
    fibreWarp: str(p.fibre_warp),
    fibreWeft: str(p.fibre_weft),
    composition: p.composition,
    weave: str(p.weave),
    zari: str(p.zari),
    description: htmlToText(p.description),
    care: str(p.care),
    occasions: p.occasions,
    blouseIncluded: p.blouse_included,
    lengthM: str(p.length_m),
    blouseLengthM: str(p.blouse_length_m),
    widthCm: str(p.width_cm),
    weightG: str(p.weight_g),
    isOneOfAKind: p.is_one_of_a_kind,
    madeToOrder: p.made_to_order,
    leadTimeDays: str(p.lead_time_days),
    giEligible: p.gi_eligible,
    weaverId: str(p.weaver_id),
    returnable: p.returnable,
    swatchAvailable: p.swatch_available,
    hsnCode: p.hsn_code,
    gstRate: String(p.gst_rate_bps / 100),
    status: p.status,
    scheduledAt: toLocalInput(p.scheduled_at),
    seoTitle: str(p.seo_title),
    seoDescription: str(p.seo_description),
    noindex: p.noindex,
    variants: [...p.product_variants]
      .sort((a, b) => a.position - b.position)
      .map((v) => ({
        id: v.id,
        sku: v.sku,
        title: str(v.title),
        colour: str(v.colour),
        colourHex: str(v.colour_hex),
        sellUnit: v.sell_unit,
        price: String(v.price_paise / 100),
        compareAt: v.compare_at_paise ? String(v.compare_at_paise / 100) : "",
        minQty: String(Number(v.min_qty)),
        active: v.active,
        stock: String(
          v.inventory_levels.reduce((n, l) => n + Number(l.on_hand) - Number(l.reserved), 0),
        ),
      })),
  };
}
