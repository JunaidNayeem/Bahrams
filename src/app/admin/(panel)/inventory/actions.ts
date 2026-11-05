"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { requireStaff } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { STOCK_ADJUSTMENT_REASONS } from "@/lib/domain/enums";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  variantId: z.uuid(),
  locationId: z.uuid(),
  delta: z.number().refine((n) => n !== 0 && Number.isFinite(n), "Enter a non-zero change"),
  // Sales are recorded only by checkout (commit_reservation), never by hand.
  reason: z.enum(STOCK_ADJUSTMENT_REASONS).exclude(["sold"]),
  note: z.string().trim().max(200).optional(),
});

export async function adjustStock(
  input: z.input<typeof schema>,
): Promise<{ ok: boolean; message: string }> {
  await requireStaff("owner", "manager", "catalogue_editor", "fulfilment");
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the adjustment." };
  const { variantId, locationId, delta, reason, note } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_stock_adjustment", {
    p_variant_id: variantId,
    p_location_id: locationId,
    p_delta: delta,
    p_reason: reason,
    p_note: note || undefined,
  });
  if (error) {
    return {
      ok: false,
      message: error.message.includes("insufficient_stock")
        ? "There isn't that much stock at this location (pieces held by open checkouts can't be removed)."
        : error.message,
    };
  }
  updateTag(CATALOG_TAG);
  return {
    ok: true,
    message: `Stock ${delta > 0 ? "increased" : "reduced"} by ${Math.abs(delta)}.`,
  };
}
