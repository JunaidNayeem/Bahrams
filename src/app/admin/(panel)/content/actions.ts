"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { requireStaff } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { CMS_TAG } from "@/lib/data/cms";
import { markupToHtml } from "@/lib/cms/simple-markup";
import { PUBLISH_STATUSES } from "@/lib/domain/enums";
import { createClient } from "@/lib/supabase/server";

const CONTENT_STAFF = ["owner", "manager", "catalogue_editor"] as const;

export type ContentResult = { ok: boolean; message: string };

const pageSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(2).max(140),
  body: z.string().max(40_000),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(170),
  status: z.enum(PUBLISH_STATUSES),
  effectiveFrom: z.string().trim(),
  changeSummary: z.string().trim().max(200),
});

/** Every save is a new version; legal pages keep their full history for audits. */
export async function savePage(form: FormData): Promise<ContentResult> {
  await requireStaff(...CONTENT_STAFF);
  const parsed = pageSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const p = parsed.data;
  const supabase = await createClient();

  const { data: page } = await supabase.from("pages").select("id, slug, kind").eq("id", p.id).single();
  if (!page) return { ok: false, message: "Page not found." };
  if (page.kind === "legal" && !p.changeSummary) return { ok: false, message: "Legal pages need a short summary of what changed." };

  const { data: latest } = await supabase
    .from("page_versions")
    .select("version")
    .eq("page_id", p.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: version, error } = await supabase
    .from("page_versions")
    .insert({
      page_id: p.id,
      version: (latest?.version ?? 0) + 1,
      title: p.title,
      body_html: markupToHtml(p.body),
      change_summary: p.changeSummary || null,
      effective_from: p.effectiveFrom || null,
    })
    .select("id, version")
    .single();
  if (error) return { ok: false, message: error.message };

  const { error: pageError } = await supabase
    .from("pages")
    .update({
      title: p.title,
      current_version_id: version.id,
      seo_title: p.seoTitle || null,
      seo_description: p.seoDescription || null,
      status: p.status,
      published_at: p.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", p.id);
  if (pageError) return { ok: false, message: pageError.message };

  updateTag(CMS_TAG);
  updateTag(`page:${page.slug}`);
  return { ok: true, message: `Saved as version ${version.version}. The store now shows it.` };
}

export async function toggleHomeSection(id: string, active: boolean): Promise<ContentResult> {
  await requireStaff(...CONTENT_STAFF);
  const supabase = await createClient();
  const { error } = await supabase.from("home_sections").update({ active }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  updateTag(CMS_TAG);
  updateTag(CATALOG_TAG);
  return { ok: true, message: active ? "Section shown on the home page." : "Section hidden." };
}

export async function moveHomeSection(id: string, direction: -1 | 1): Promise<ContentResult> {
  await requireStaff(...CONTENT_STAFF);
  const supabase = await createClient();
  const { data } = await supabase.from("home_sections").select("id, position").order("position");
  const list = data ?? [];
  const i = list.findIndex((s) => s.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return { ok: false, message: "Can't move further." };
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((s, idx) => supabase.from("home_sections").update({ position: idx }).eq("id", s.id)));
  updateTag(CMS_TAG);
  return { ok: true, message: "Order updated." };
}

export async function renameHomeSection(id: string, title: string): Promise<ContentResult> {
  await requireStaff(...CONTENT_STAFF);
  const supabase = await createClient();
  const { error } = await supabase.from("home_sections").update({ title: title.trim().slice(0, 120) || null }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  updateTag(CMS_TAG);
  return { ok: true, message: "Heading updated." };
}
