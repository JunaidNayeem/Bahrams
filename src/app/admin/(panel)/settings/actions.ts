"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { requireStaff } from "@/lib/auth";
import type { Json } from "@/lib/db";
import { SETTINGS_TAG } from "@/lib/data/settings";
import { rupeesToPaise } from "@/lib/domain/money";
import { gstinSchema } from "@/lib/domain/validation";
import { createClient } from "@/lib/supabase/server";

const rupees = z.string().refine((v) => v.trim() !== "" && Number(v) >= 0, "Enter an amount in rupees");
const optText = (max: number) => z.string().trim().max(max);

const schema = z.object({
  codMax: rupees,
  codFee: rupees,
  freeShipping: rupees,
  shippingFee: rupees,
  giftWrap: rupees,
  prepaidAmount: rupees,
  prepaidMessage: optText(80),
  returnWindowDays: z.string().refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 30, "0–30 days"),
  entityName: z.string().trim().min(2).max(120),
  entityAddress: optText(300),
  entityGstin: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || gstinSchema.safeParse(v).success, "That GSTIN isn't valid"),
  entityEmail: z.union([z.literal(""), z.email()]),
  entityPhone: optText(20),
  officerName: z.string().trim().min(2).max(120),
  officerEmail: z.email(),
  officerPhone: optText(20),
  officerHours: optText(120),
});

/** Store-wide settings shown on the site (footer, cart, checkout). Owner and manager only. */
export async function saveSettings(form: FormData): Promise<{ ok: boolean; message: string }> {
  await requireStaff("owner", "manager");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { ok: false, message: i ? `${i.path.join(".")}: ${i.message}` : "Check the form." };
  }
  const s = parsed.data;
  const supabase = await createClient();
  const { data: current } = await supabase.from("settings").select("key, value").in("key", ["legal_entity", "grievance_officer"]);
  const existing = Object.fromEntries((current ?? []).map((r) => [r.key, (r.value ?? {}) as Record<string, Json>]));

  const rows: { key: string; value: NonNullable<Json>; is_public: boolean }[] = [
    { key: "cod_max_order_paise", value: rupeesToPaise(Number(s.codMax)), is_public: true },
    { key: "cod_fee_paise", value: rupeesToPaise(Number(s.codFee)), is_public: true },
    { key: "free_shipping_threshold_paise", value: rupeesToPaise(Number(s.freeShipping)), is_public: true },
    { key: "shipping_fee_paise", value: rupeesToPaise(Number(s.shippingFee)), is_public: true },
    { key: "gift_wrap_paise", value: rupeesToPaise(Number(s.giftWrap)), is_public: true },
    {
      key: "prepaid_incentive",
      value: Number(s.prepaidAmount) > 0 ? { type: "flat", amount_paise: rupeesToPaise(Number(s.prepaidAmount)), message: s.prepaidMessage } : { type: "none" },
      is_public: true,
    },
    { key: "return_window_days", value: Number(s.returnWindowDays), is_public: true },
    {
      key: "legal_entity",
      value: { ...existing.legal_entity, name: s.entityName, address: s.entityAddress, gstin: s.entityGstin || null, email: s.entityEmail, phone: s.entityPhone || null },
      is_public: true,
    },
    {
      key: "grievance_officer",
      value: { ...existing.grievance_officer, name: s.officerName, email: s.officerEmail, phone: s.officerPhone || null, hours: s.officerHours },
      is_public: true,
    },
  ];
  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) return { ok: false, message: error.message };
  updateTag(SETTINGS_TAG);
  return { ok: true, message: "Settings saved. The store footer, cart and checkout now use them." };
}
