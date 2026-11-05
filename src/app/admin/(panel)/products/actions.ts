"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import sharp from "sharp";
import { z } from "zod";

import { adminUrls, productUrl } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { FIBRES, OCCASIONS, PRODUCT_KINDS, PUBLISH_STATUSES, SELL_UNITS } from "@/lib/domain/enums";
import { rupeesToPaise } from "@/lib/domain/money";
import { validatePriorPrice } from "@/lib/domain/pricing";
import { slugify } from "@/lib/domain/slug";
import { variantLabel } from "@/lib/domain/variants";
import { createClient } from "@/lib/supabase/server";

const EDITORS = ["owner", "manager", "catalogue_editor"] as const;

export type SaveState = { ok: boolean; message: string | null; errors: Record<string, string> };

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));
const optNumber = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v > 0), "Enter a positive number");
const optFibre = z
  .string()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.enum(FIBRES).nullable());

const variantSchema = z.object({
  id: z.string().transform((v) => (v === "" ? null : v)),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,40}$/, "3–40 capitals, digits or dashes"),
  title: text(80),
  colour: text(40),
  colourHex: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || /^#[0-9a-fA-F]{6}$/.test(v), "Use a hex colour like #C8A46A"),
  sellUnit: z.enum(SELL_UNITS),
  price: z.string().refine((v) => Number(v) > 0, "Enter the price in rupees"),
  compareAt: optNumber,
  minQty: z.string().refine((v) => Number(v) > 0, "Enter a minimum quantity"),
  openingStock: optNumber,
  active: z.boolean(),
});

const productSchema = z.object({
  id: z.string().transform((v) => (v === "" ? null : v)),
  title: z.string().trim().min(3, "Give the product a title").max(140),
  slug: z
    .string()
    .trim()
    .transform((v) => slugify(v))
    .refine((v) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), "Use lowercase letters, digits and dashes"),
  subtitle: text(200),
  kind: z.enum(PRODUCT_KINDS),
  primaryFibre: z.enum(FIBRES),
  fibreWarp: optFibre,
  fibreWeft: optFibre,
  composition: z
    .string()
    .trim()
    .min(3, "State the composition, e.g. “Tussar silk warp, ghicha silk weft”")
    .max(200),
  weave: text(80),
  zari: text(120),
  description: z.string().trim().max(6000),
  care: text(600),
  occasions: z.array(z.enum(OCCASIONS)),
  blouseIncluded: z.boolean(),
  lengthM: optNumber,
  blouseLengthM: optNumber,
  widthCm: optNumber,
  weightG: optNumber,
  isOneOfAKind: z.boolean(),
  madeToOrder: z.boolean(),
  leadTimeDays: optNumber,
  giEligible: z.boolean(),
  weaverId: z.string().transform((v) => (v === "" ? null : v)),
  returnable: z.boolean(),
  swatchAvailable: z.boolean(),
  hsnCode: z
    .string()
    .trim()
    .regex(/^[0-9]{4,8}$/, "4–8 digit HSN code"),
  gstRate: z.string().refine((v) => [0, 5, 12, 18, 28].includes(Number(v)), "Choose a GST rate"),
  silkMarkLabel: text(40),
  handloomMarkLabel: text(40),
  status: z.enum(PUBLISH_STATUSES),
  scheduledAt: z.string().transform((v) => (v === "" ? null : new Date(v).toISOString())),
  seoTitle: text(70),
  seoDescription: text(170),
  noindex: z.boolean(),
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
});

/** Reads the editor's flat FormData (variants.0.sku, …) into the nested shape the schema expects. */
function fromForm(form: FormData) {
  const s = (k: string) => String(form.get(k) ?? "");
  const b = (k: string) => form.get(k) === "on";
  const rows = [
    ...new Set(
      [...form.keys()].filter((k) => k.startsWith("variants.")).map((k) => k.split(".")[1]),
    ),
  ];
  return {
    id: s("id"),
    title: s("title"),
    slug: s("slug") || s("title"),
    subtitle: s("subtitle"),
    kind: s("kind"),
    primaryFibre: s("primaryFibre"),
    fibreWarp: s("fibreWarp"),
    fibreWeft: s("fibreWeft"),
    composition: s("composition"),
    weave: s("weave"),
    zari: s("zari"),
    description: s("description"),
    care: s("care"),
    occasions: form.getAll("occasions").map(String),
    blouseIncluded: b("blouseIncluded"),
    lengthM: s("lengthM"),
    blouseLengthM: s("blouseLengthM"),
    widthCm: s("widthCm"),
    weightG: s("weightG"),
    isOneOfAKind: b("isOneOfAKind"),
    madeToOrder: b("madeToOrder"),
    leadTimeDays: s("leadTimeDays"),
    giEligible: b("giEligible"),
    weaverId: s("weaverId"),
    returnable: b("returnable"),
    swatchAvailable: b("swatchAvailable"),
    hsnCode: s("hsnCode"),
    gstRate: s("gstRate"),
    silkMarkLabel: s("silkMarkLabel"),
    handloomMarkLabel: s("handloomMarkLabel"),
    status: s("status"),
    scheduledAt: s("scheduledAt"),
    seoTitle: s("seoTitle"),
    seoDescription: s("seoDescription"),
    noindex: b("noindex"),
    variants: rows.map((i) => ({
      id: s(`variants.${i}.id`),
      sku: s(`variants.${i}.sku`),
      title: s(`variants.${i}.title`),
      colour: s(`variants.${i}.colour`),
      colourHex: s(`variants.${i}.colourHex`),
      sellUnit: s(`variants.${i}.sellUnit`),
      price: s(`variants.${i}.price`),
      compareAt: s(`variants.${i}.compareAt`),
      minQty: s(`variants.${i}.minQty`),
      openingStock: s(`variants.${i}.openingStock`),
      active: b(`variants.${i}.active`),
    })),
  };
}

const escapeHtml = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Plain-text paragraphs → escaped HTML, so stored descriptions can never carry markup or scripts. */
function paragraphsToHtml(textBody: string): string | null {
  const paras = textBody
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paras.length
    ? paras.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("")
    : null;
}

export async function saveProduct(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireStaff(...EDITORS);
  const raw = fromForm(form);
  // Variant row keys are client indices; keep the order the editor showed.
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join(".")] ??= issue.message;
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const p = parsed.data;
  const errors: Record<string, string> = {};
  if (p.madeToOrder && !p.leadTimeDays)
    errors.leadTimeDays = "Made-to-order pieces need a lead time";
  if (p.status === "scheduled" && !p.scheduledAt) errors.scheduledAt = "Pick a publish date";
  p.variants.forEach((v, i) => {
    const min = Number(v.minQty);
    if (v.sellUnit === "piece" && !Number.isInteger(min))
      errors[`variants.${i}.minQty`] = "Pieces are whole numbers";
    if (v.sellUnit === "metre" && !Number.isInteger(min * 2))
      errors[`variants.${i}.minQty`] = "Use 0.5 m steps";
  });
  // Shoppers choose between designs by name (and colour): each must be named, and distinctly.
  if (p.variants.filter((v) => v.active).length > 1) {
    const seen = new Map<string, number>();
    p.variants.forEach((v, i) => {
      if (!v.active) return;
      if (!v.title && !v.colour) {
        errors[`variants.${i}.title`] =
          "Name this design (or give it a colour) so shoppers can tell it apart";
        return;
      }
      const key = variantLabel({ sku: v.sku, title: v.title, colour: v.colour }).toLowerCase();
      if (seen.has(key))
        errors[`variants.${i}.title`] =
          `Same name as design ${seen.get(key)! + 1}; make each one distinct`;
      else seen.set(key, i);
    });
  }
  if (Object.keys(errors).length)
    return { ok: false, message: "Please fix the highlighted fields.", errors };

  const supabase = await createClient();
  const previous = p.id
    ? (await supabase.from("products").select("slug").eq("id", p.id).maybeSingle()).data
    : null;

  // Compare-at prices must be genuine (E-Commerce Amendment Rules 2026): validate against history.
  const existingIds = p.variants.map((v) => v.id).filter((id): id is string => Boolean(id));
  const { data: history } = existingIds.length
    ? await supabase
        .from("price_history")
        .select("variant_id, price_paise, effective_from, effective_to")
        .in("variant_id", existingIds)
    : { data: [] };
  p.variants.forEach((v, i) => {
    if (v.compareAt === null) return;
    const result = validatePriorPrice({
      currentPricePaise: rupeesToPaise(v.price),
      compareAtPaise: rupeesToPaise(v.compareAt),
      history: (history ?? [])
        .filter((h) => h.variant_id === v.id)
        .map((h) => ({
          pricePaise: h.price_paise,
          effectiveFrom: h.effective_from,
          effectiveTo: h.effective_to,
        })),
      now: new Date(),
    });
    if (!result.valid) {
      errors[`variants.${i}.compareAt`] =
        result.reason === "not_higher_than_current"
          ? "The prior price must be higher than the selling price"
          : "Only a price this piece actually sold at for 7+ days in the last 90 days can be shown as the prior price";
    }
  });
  if (Object.keys(errors).length)
    return { ok: false, message: "Prior price can't be shown.", errors };

  const row = {
    title: p.title,
    slug: p.slug,
    subtitle: p.subtitle,
    kind: p.kind,
    primary_fibre: p.primaryFibre,
    fibre_warp: p.fibreWarp,
    fibre_weft: p.fibreWeft,
    composition: p.composition,
    weave: p.weave,
    zari: p.zari,
    description: paragraphsToHtml(p.description),
    care: p.care,
    occasions: p.occasions,
    blouse_included: p.blouseIncluded,
    length_m: p.lengthM,
    blouse_length_m: p.blouseLengthM,
    width_cm: p.widthCm,
    weight_g: p.weightG === null ? null : Math.round(p.weightG),
    is_one_of_a_kind: p.isOneOfAKind,
    made_to_order: p.madeToOrder,
    lead_time_days: p.madeToOrder ? p.leadTimeDays : null,
    gi_eligible: p.giEligible,
    weaver_id: p.weaverId,
    returnable: p.returnable,
    swatch_available: p.swatchAvailable,
    hsn_code: p.hsnCode,
    gst_rate_bps: Number(p.gstRate) * 100,
    status: p.status,
    scheduled_at: p.status === "scheduled" ? p.scheduledAt : null,
    seo_title: p.seoTitle,
    seo_description: p.seoDescription,
    noindex: p.noindex,
  };

  const saved = p.id
    ? await supabase.from("products").update(row).eq("id", p.id).select("id").single()
    : await supabase.from("products").insert(row).select("id").single();
  if (saved.error) {
    return {
      ok: false,
      message:
        saved.error.code === "23505"
          ? "Another product already uses that URL slug."
          : saved.error.message,
      errors: saved.error.code === "23505" ? { slug: "Already in use" } : {},
    };
  }
  const productId = saved.data.id;

  // Variants: update existing, insert new. Removed rows are deactivated, never deleted, so past
  // orders keep their references.
  const { data: defaultLocation } = await supabase
    .from("stock_locations")
    .select("id")
    .eq("is_default", true)
    .maybeSingle();
  // Ids of every variant in this save, including ones just inserted (which had no id in the form).
  const savedIds: string[] = [];
  for (const [i, v] of p.variants.entries()) {
    const variantRow = {
      product_id: productId,
      sku: v.sku,
      title: v.title,
      colour: v.colour,
      colour_hex: v.colourHex,
      sell_unit: v.sellUnit,
      price_paise: rupeesToPaise(v.price),
      compare_at_paise: v.compareAt === null ? null : rupeesToPaise(v.compareAt),
      min_qty: Number(v.minQty),
      step_qty: v.sellUnit === "metre" ? 0.5 : 1,
      position: i,
      active: v.active,
    };
    const res = v.id
      ? await supabase
          .from("product_variants")
          .update(variantRow)
          .eq("id", v.id)
          .select("id")
          .single()
      : await supabase.from("product_variants").insert(variantRow).select("id").single();
    if (res.error) {
      return {
        ok: false,
        message:
          res.error.code === "23505"
            ? `SKU ${v.sku} is already used by another product.`
            : res.error.message,
        errors: res.error.code === "23505" ? { [`variants.${i}.sku`]: "Already in use" } : {},
      };
    }
    savedIds.push(res.data.id);
    if (!v.id && v.openingStock && defaultLocation) {
      const adj = await supabase.rpc("apply_stock_adjustment", {
        p_variant_id: res.data.id,
        p_location_id: defaultLocation.id,
        p_delta: v.openingStock,
        p_reason: "received",
        p_note: "Opening stock",
      });
      if (adj.error)
        return {
          ok: false,
          message: `Saved, but opening stock failed: ${adj.error.message}`,
          errors: {},
        };
    }
  }
  // Rows removed in the editor are deactivated. Keep everything saved above: a design added in
  // this save has no id in the form, and deactivating by form ids alone switched new designs off.
  if (p.id) {
    await supabase
      .from("product_variants")
      .update({ active: false })
      .eq("product_id", productId)
      .not("id", "in", `(${savedIds.join(",")})`);
  }

  // Authenticity labels are records, not text: badges on the store render only from these rows.
  for (const [type, number] of [
    ["silk_mark", p.silkMarkLabel],
    ["handloom_mark", p.handloomMarkLabel],
  ] as const) {
    const { data: current } = await supabase
      .from("authenticity_labels")
      .select("id, label_number")
      .eq("product_id", productId)
      .eq("label_type", type)
      .in("status", ["attached", "sold"]);
    const normalised = number?.toUpperCase() ?? null;
    const stale = (current ?? []).filter((l) => l.label_number !== normalised);
    if (stale.length)
      await supabase
        .from("authenticity_labels")
        .update({ status: "void" })
        .in(
          "id",
          stale.map((l) => l.id),
        );
    if (normalised && !(current ?? []).some((l) => l.label_number === normalised)) {
      const ins = await supabase.from("authenticity_labels").insert({
        label_type: type,
        label_number: normalised,
        product_id: productId,
        status: "attached",
      });
      if (ins.error) {
        const field = type === "silk_mark" ? "silkMarkLabel" : "handloomMarkLabel";
        return {
          ok: false,
          message:
            ins.error.code === "23505"
              ? "That label number is already recorded on another piece."
              : ins.error.message,
          errors: { [field]: "Label number already used" },
        };
      }
    }
  }

  // A renamed product keeps its old URL working (301), so links and rankings are not lost.
  if (previous && previous.slug !== p.slug) {
    await supabase
      .from("redirects")
      .upsert(
        { from_path: productUrl(previous.slug), to_path: productUrl(p.slug), status_code: 301 },
        { onConflict: "from_path" },
      );
  }

  updateTag(CATALOG_TAG);
  updateTag(`product:${p.slug}`);
  if (previous) updateTag(`product:${previous.slug}`);

  if (!p.id) redirect(`${adminUrls.product(productId)}?created=1`);
  return { ok: true, message: "Saved. The store now shows these changes.", errors: {} };
}

/* ------------------------------------------------------------------------------------------
 * Media
 * ---------------------------------------------------------------------------------------- */

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function uploadProductImages(
  productId: string,
  form: FormData,
): Promise<{ ok: boolean; message: string }> {
  await requireStaff(...EDITORS);
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("slug, title")
    .eq("id", productId)
    .single();
  if (!product) return { ok: false, message: "Product not found." };
  const { data: existing } = await supabase
    .from("product_media")
    .select("sort")
    .eq("product_id", productId);
  let sort = Math.max(-1, ...(existing ?? []).map((m) => m.sort)) + 1;
  // Optional: the design these photos show. Blank means shared by every design.
  const variantId = String(form.get("variantId") ?? "") || null;
  if (variantId && !(await variantBelongsTo(supabase, variantId, productId))) {
    return { ok: false, message: "That design is not part of this product." };
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, message: "Choose at least one image." };
  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES)
      return { ok: false, message: `${file.name} is larger than 10 MB.` };
    if (!file.type.startsWith("image/"))
      return { ok: false, message: `${file.name} is not an image.` };
    // Re-encode server-side: strips EXIF/GPS metadata, normalises orientation, caps size.
    const image = sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 2000, height: 2500, fit: "inside", withoutEnlargement: true });
    const { data: webp, info } = await image
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const path = `products/${product.slug}/${crypto.randomUUID().slice(0, 8)}.webp`;
    const up = await supabase.storage
      .from("product-media")
      .upload(path, webp, { contentType: "image/webp", cacheControl: "31536000" });
    if (up.error) return { ok: false, message: up.error.message };
    await supabase.from("product_media").insert({
      product_id: productId,
      variant_id: variantId,
      storage_path: path,
      alt: `${product.title}${sort === 0 ? "" : `, photo ${sort + 1}`}`,
      sort: sort++,
      width: info.width,
      height: info.height,
    });
  }
  updateTag(CATALOG_TAG);
  updateTag(`product:${product.slug}`);
  return { ok: true, message: `${files.length} photo${files.length > 1 ? "s" : ""} added.` };
}

async function mediaContext(mediaId: string) {
  await requireStaff(...EDITORS);
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_media")
    .select("id, product_id, storage_path, sort, products ( slug )")
    .eq("id", mediaId)
    .single();
  return { supabase, media: data };
}

async function variantBelongsTo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  variantId: string,
  productId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("product_variants")
    .select("id")
    .eq("id", variantId)
    .eq("product_id", productId)
    .maybeSingle();
  return Boolean(data);
}

/** Which design a photo shows; null makes it a shared photo (shown with every design). */
export async function setMediaVariant(mediaId: string, variantId: string | null) {
  const { supabase, media } = await mediaContext(mediaId);
  if (!media) return { ok: false, message: "Photo not found." };
  if (variantId && !(await variantBelongsTo(supabase, variantId, media.product_id))) {
    return { ok: false, message: "That design is not part of this product." };
  }
  const { error } = await supabase
    .from("product_media")
    .update({ variant_id: variantId })
    .eq("id", mediaId);
  if (error) return { ok: false, message: error.message };
  updateTag(CATALOG_TAG);
  updateTag(`product:${media.products.slug}`);
  return {
    ok: true,
    message: variantId ? "Photo assigned to the design." : "Photo shared by all designs.",
  };
}

export async function updateMediaAlt(mediaId: string, alt: string) {
  const { supabase, media } = await mediaContext(mediaId);
  if (!media) return;
  await supabase
    .from("product_media")
    .update({ alt: alt.trim().slice(0, 200) })
    .eq("id", mediaId);
  updateTag(`product:${media.products.slug}`);
}

/** Moves a photo up or down among the photos of the same design (or among the shared photos). */
export async function moveMedia(mediaId: string, direction: -1 | 1) {
  const { supabase, media } = await mediaContext(mediaId);
  if (!media) return;
  const { data: all } = await supabase
    .from("product_media")
    .select("id, sort, variant_id")
    .eq("product_id", media.product_id)
    .order("sort");
  const list = all ?? [];
  const i = list.findIndex((m) => m.id === mediaId);
  if (i < 0) return;
  let j = i + direction;
  while (j >= 0 && j < list.length && list[j].variant_id !== list[i].variant_id) j += direction;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(
    list.map((m, idx) => supabase.from("product_media").update({ sort: idx }).eq("id", m.id)),
  );
  updateTag(CATALOG_TAG);
  updateTag(`product:${media.products.slug}`);
}

export async function deleteMedia(mediaId: string) {
  const { supabase, media } = await mediaContext(mediaId);
  if (!media) return;
  await supabase.from("product_media").delete().eq("id", mediaId);
  await supabase.storage.from("product-media").remove([media.storage_path]);
  updateTag(CATALOG_TAG);
  updateTag(`product:${media.products.slug}`);
}
