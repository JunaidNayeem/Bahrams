import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";

export const CMS_TAG = "cms";

export interface HomeSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  config: Record<string, unknown>;
}

/** Active home sections in display order. Scheduling windows are applied at cache time. */
export async function getHomeSections(): Promise<HomeSection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CMS_TAG);

  const { data, error } = await createPublicClient()
    .from("home_sections")
    .select("id, type, title, subtitle, config, starts_at, ends_at, active")
    .eq("active", true)
    .order("position");
  if (error) throw error;

  const now = Date.now();
  return data
    .filter((s) => (!s.starts_at || Date.parse(s.starts_at) <= now) && (!s.ends_at || Date.parse(s.ends_at) > now))
    .map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      subtitle: s.subtitle,
      config: (s.config ?? {}) as Record<string, unknown>,
    }));
}

export interface CmsPage {
  slug: string;
  kind: string;
  title: string;
  bodyHtml: string;
  effectiveFrom: string | null;
  version: number;
  seoTitle: string | null;
  seoDescription: string | null;
  noindex: boolean;
  updatedAt: string;
}

/**
 * A published CMS page (legal, help, craft). `bodyHtml` is sanitised by the admin editor on save;
 * only staff can write page_versions (RLS).
 */
export async function getPage(slug: string): Promise<CmsPage | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CMS_TAG, `page:${slug}`);

  const { data, error } = await createPublicClient()
    .from("pages")
    .select(
      "slug, kind, title, seo_title, seo_description, noindex, updated_at, page_versions!pages_current_version_fk ( title, body_html, effective_from, version )",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  const v = data?.page_versions;
  if (!data || !v) return null;

  return {
    slug: data.slug,
    kind: data.kind,
    title: v.title ?? data.title,
    bodyHtml: v.body_html,
    effectiveFrom: v.effective_from,
    version: v.version,
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    noindex: data.noindex,
    updatedAt: data.updated_at,
  };
}

export interface ApprovedReview {
  id: string;
  productSlug: string;
  productTitle: string;
  authorName: string;
  authorCity: string | null;
  rating: number;
  title: string | null;
  body: string;
}

export async function listRecentReviews(limit = 6, minRating = 4): Promise<ApprovedReview[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CMS_TAG);

  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, author_name, author_city, rating, title, body, products ( slug, title )")
    .gte("rating", minRating)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data
    .filter((r) => r.products)
    .map((r) => ({
      id: r.id,
      productSlug: r.products!.slug,
      productTitle: r.products!.title,
      authorName: r.author_name,
      authorCity: r.author_city,
      rating: r.rating,
      title: r.title,
      body: r.body,
    }));
}

export interface WeaverSummary {
  slug: string;
  name: string;
  locality: string | null;
  bio: string | null;
  yearsWeaving: number | null;
  isSample: boolean;
}

export async function listWeavers(slugs?: string[]): Promise<WeaverSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CMS_TAG);

  let q = createPublicClient()
    .from("weavers")
    .select("slug, name, locality, bio, years_weaving, is_sample")
    .order("name");
  if (slugs?.length) q = q.in("slug", slugs);
  const { data, error } = await q;
  if (error) throw error;
  return data.map((w) => ({
    slug: w.slug,
    name: w.name,
    locality: w.locality,
    bio: w.bio,
    yearsWeaving: w.years_weaving,
    isSample: w.is_sample,
  }));
}

export async function getWeaver(slug: string): Promise<(WeaverSummary & { specialities: string[] }) | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CMS_TAG);

  const { data, error } = await createPublicClient()
    .from("weavers")
    .select("slug, name, locality, bio, years_weaving, is_sample, specialities")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    slug: data.slug,
    name: data.name,
    locality: data.locality,
    bio: data.bio,
    yearsWeaving: data.years_weaving,
    isSample: data.is_sample,
    specialities: data.specialities,
  };
}
