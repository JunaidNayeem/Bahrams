"use server";

import { updateTag } from "next/cache";

import { requireStaff } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { CMS_TAG } from "@/lib/data/cms";
import { createClient } from "@/lib/supabase/server";

const MODERATORS = ["owner", "manager", "catalogue_editor", "support"] as const;

export async function moderateReview(id: string, status: "approved" | "rejected") {
  const staff = await requireStaff(...MODERATORS);
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ status, moderated_by: staff.userId, moderated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  updateTag(CATALOG_TAG);
  updateTag(CMS_TAG);
  return { ok: true, message: status === "approved" ? "Review published." : "Review hidden." };
}

export async function replyToReview(id: string, body: string) {
  const staff = await requireStaff(...MODERATORS);
  const text = body.trim().slice(0, 1000);
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ reply_body: text || null, replied_by: text ? staff.userId : null, replied_at: text ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  updateTag(CATALOG_TAG);
  return { ok: true, message: text ? "Reply published." : "Reply removed." };
}
