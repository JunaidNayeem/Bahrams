/**
 * Breadcrumb trails shared by the visible breadcrumb component and BreadcrumbList JSON-LD,
 * so the two can never disagree.
 */
import {
  CATALOGUE_SECTIONS,
  GUIDES,
  OCCASION_LABELS,
  PRICE_BANDS,
  findCollection,
  guideUrl,
  journalUrl,
  occasionUrl,
  priceBandUrl,
  productUrl,
  routes,
  type CollectionSection,
  type GuideSlug,
  type PriceBandSlug,
} from "@/config/routes";
import type { Occasion, ProductKind } from "@/lib/domain/enums";
import type { BreadcrumbItem } from "./jsonld";

const HOME: BreadcrumbItem = { name: "Home", path: routes.home };

const SECTION_KIND: Record<CollectionSection, ProductKind> = { sarees: "saree", fabric: "fabric" };

export function sectionBreadcrumbs(kind: ProductKind): BreadcrumbItem[] {
  const section = CATALOGUE_SECTIONS[kind];
  return [HOME, { name: section.label, path: section.path }];
}

export function collectionBreadcrumbs(section: CollectionSection, slug: string): BreadcrumbItem[] {
  const collection = findCollection(section, slug);
  const trail = sectionBreadcrumbs(SECTION_KIND[section]);
  if (!collection) return trail;
  // findCollection has validated the slug, so build the path directly.
  return [...trail, { name: collection.name, path: `/${section}/${collection.slug}` }];
}

export function occasionBreadcrumbs(occasion: Occasion): BreadcrumbItem[] {
  return [HOME, { name: OCCASION_LABELS[occasion], path: occasionUrl(occasion) }];
}

export function priceBandBreadcrumbs(band: PriceBandSlug): BreadcrumbItem[] {
  const label = PRICE_BANDS.find((b) => b.slug === band)?.label ?? band;
  return [HOME, { name: label, path: priceBandUrl(band) }];
}

export interface ProductBreadcrumbInput {
  name: string;
  slug: string;
  kind: ProductKind;
  /** Primary collection, e.g. { section: "sarees", slug: "tussar-silk" }. */
  collection?: { section: CollectionSection; slug: string };
}

/** Home > Sarees > Tussar silk > {product}. */
export function productBreadcrumbs(input: ProductBreadcrumbInput): BreadcrumbItem[] {
  const trail = input.collection
    ? collectionBreadcrumbs(input.collection.section, input.collection.slug)
    : sectionBreadcrumbs(input.kind);
  return [...trail, { name: input.name, path: productUrl(input.slug) }];
}

export function guideBreadcrumbs(slug: GuideSlug): BreadcrumbItem[] {
  const guide = GUIDES.find((g) => g.slug === slug);
  return [HOME, { name: guide?.navLabel ?? slug, path: guideUrl(slug) }];
}

export function journalBreadcrumbs(article?: { title: string; slug: string }): BreadcrumbItem[] {
  const trail = [HOME, { name: "Journal", path: journalUrl() }];
  return article ? [...trail, { name: article.title, path: journalUrl(article.slug) }] : trail;
}
