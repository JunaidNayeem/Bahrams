"use server";

import { z } from "zod";

import { requireStaff } from "@/lib/auth";
import { COUPON_TYPES } from "@/lib/domain/enums";
import { rupeesToPaise } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

const MARKETERS = ["owner", "manager"] as const;

const optRupees = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v > 0), "Enter a positive amount");

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{4,20}$/, "4–20 letters or digits"),
    type: z.enum(COUPON_TYPES),
    value: z.string().trim(),
    maxDiscount: optRupees,
    minOrder: optRupees,
    startsAt: z.string().trim(),
    endsAt: z.string().trim(),
    usageLimit: z.string().trim(),
    perCustomer: z.string().trim(),
    firstOrderOnly: z.boolean(),
    description: z.string().trim().max(200),
  })
  .superRefine((c, ctx) => {
    const v = Number(c.value);
    if (c.type === "percentage" && !(v > 0 && v <= 50))
      ctx.addIssue({ code: "custom", path: ["value"], message: "Percentage between 1 and 50" });
    if (c.type === "flat" && !(v > 0))
      ctx.addIssue({ code: "custom", path: ["value"], message: "Enter the discount in rupees" });
    if (c.startsAt && c.endsAt && c.endsAt <= c.startsAt)
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after start" });
  });

export async function createCoupon(form: FormData): Promise<{ ok: boolean; message: string }> {
  const staff = await requireStaff(...MARKETERS);
  const parsed = couponSchema.safeParse({
    ...Object.fromEntries(form),
    firstOrderOnly: form.get("firstOrderOnly") === "on",
  });
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return {
      ok: false,
      message: i ? `${i.path.join(".") || "Coupon"}: ${i.message}` : "Check the coupon.",
    };
  }
  const c = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").insert({
    code: c.code,
    type: c.type,
    percent_bps: c.type === "percentage" ? Math.round(Number(c.value) * 100) : null,
    amount_paise: c.type === "flat" ? rupeesToPaise(Number(c.value)) : null,
    max_discount_paise: c.maxDiscount === null ? null : rupeesToPaise(c.maxDiscount),
    min_order_paise: c.minOrder === null ? 0 : rupeesToPaise(c.minOrder),
    starts_at: c.startsAt ? new Date(c.startsAt).toISOString() : null,
    ends_at: c.endsAt ? new Date(c.endsAt).toISOString() : null,
    usage_limit: c.usageLimit ? Number(c.usageLimit) : null,
    usage_limit_per_customer: c.perCustomer ? Number(c.perCustomer) : null,
    first_order_only: c.firstOrderOnly,
    description: c.description || null,
    active: true,
    created_by: staff.userId,
  });
  if (error)
    return {
      ok: false,
      message: error.code === "23505" ? "That code already exists." : error.message,
    };
  return { ok: true, message: `Coupon ${c.code} is live.` };
}

export async function setCouponActive(
  id: string,
  active: boolean,
): Promise<{ ok: boolean; message: string }> {
  await requireStaff(...MARKETERS);
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").update({ active }).eq("id", id);
  return error
    ? { ok: false, message: error.message }
    : { ok: true, message: active ? "Coupon enabled." : "Coupon paused." };
}
