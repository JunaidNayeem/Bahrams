/**
 * JSON-LD builders for every storefront template. Each builder returns a plain, serialisable
 * object with "@context"; render it with <JsonLd data={...} /> from @/components/seo/json-ld.
 *
 * Template map:
 *   root layout        organizationJsonLd() + websiteJsonLd()
 *   collection pages   breadcrumbJsonLd() + faqPageJsonLd() when the FAQ block is visible
 *   product pages      productJsonLd() or productGroupJsonLd() + breadcrumbJsonLd()
 *   guides / journal   articleJsonLd() + breadcrumbJsonLd()
 *   contact (store)    storeJsonLd()
 */
import { siteConfig } from "@/config/site";
import { absoluteUrl, routes, siteOrigin } from "@/config/routes";
import { LOGO_PATH, organizationId, websiteId } from "./constants";
import { absoluteUrls, compact, publishablePhone } from "./jsonld-utils";
import {
  SCHEMA_CONTEXT,
  type ArticleLd,
  type BreadcrumbListLd,
  type ClothingStoreLd,
  type FaqPageLd,
  type ImageObjectLd,
  type JsonLdDocument,
  type OrganizationLd,
  type PostalAddressLd,
  type WebPageLd,
  type WebSiteLd,
  type WithContext,
} from "./schema-types";

export * from "./schema-types";
export {
  DEFAULT_RETURN_POLICY,
  NOT_RETURNABLE,
  aggregateRatingJsonLd,
  offerJsonLd,
  productGroupJsonLd,
  productJsonLd,
  returnPolicyJsonLd,
  reviewJsonLd,
  shippingDetailsJsonLd,
  type DayRange,
  type ProductAvailability,
  type ProductGroupJsonLdInput,
  type ProductJsonLdInput,
  type RatingSummary,
  type RefundType,
  type ReturnPolicy,
  type ReviewInput,
  type ShippingPolicy,
  type VariesBy,
} from "./product-jsonld";
export { paiseToSchemaPrice } from "./jsonld-utils";

/* ------------------------------------------------------------------------------------------
 * Serialisation
 * ---------------------------------------------------------------------------------------- */

/**
 * JSON for an inline <script type="application/ld+json">. Escapes "<" (so a product name
 * containing "</script>" cannot close the tag), ">" and "&", plus U+2028/U+2029 which are
 * line terminators in older JS parsers. The escapes are valid JSON, so parsers see the same data.
 */
export function serializeJsonLd(data: JsonLdDocument | readonly JsonLdDocument[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/* ------------------------------------------------------------------------------------------
 * Organisation and website (root layout)
 * ---------------------------------------------------------------------------------------- */

function logo(): ImageObjectLd {
  return { "@type": "ImageObject", url: absoluteUrl(LOGO_PATH), width: 512, height: 512 };
}

function bhagalpurAddress(
  street: string = siteConfig.contact.streetAddress,
  postalCode: string = siteConfig.contact.postalCode,
): PostalAddressLd {
  return compact({
    "@type": "PostalAddress" as const,
    streetAddress: street,
    addressLocality: "Bhagalpur",
    addressRegion: siteConfig.sellerState.name,
    postalCode,
    addressCountry: "IN",
  });
}

export interface OrganizationJsonLdOptions {
  /** Social profile URLs; defaults to siteConfig.social. */
  sameAs?: readonly string[];
}

export function organizationJsonLd(
  options: OrganizationJsonLdOptions = {},
): WithContext<OrganizationLd> {
  return compact({
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization" as const,
    "@id": organizationId(),
    name: siteConfig.name,
    url: siteOrigin(),
    logo: logo(),
    description: siteConfig.description,
    sameAs: options.sameAs ?? Object.values(siteConfig.social),
    contactPoint: [
      compact({
        "@type": "ContactPoint" as const,
        contactType: "customer service",
        email: siteConfig.contact.email,
        telephone: publishablePhone(siteConfig.contact.phone),
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      }),
    ],
    address: bhagalpurAddress(),
    foundingDate: siteConfig.foundingYear ? String(siteConfig.foundingYear) : undefined,
  });
}

/** WebSite with a SearchAction pointing at /search?q=. */
export function websiteJsonLd(): WithContext<WebSiteLd> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    "@id": websiteId(),
    url: siteOrigin(),
    name: siteConfig.name,
    inLanguage: siteConfig.locale,
    publisher: { "@id": organizationId() },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl(routes.search)}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ------------------------------------------------------------------------------------------
 * Breadcrumbs
 * ---------------------------------------------------------------------------------------- */

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/** BreadcrumbList; pass the same items the visible breadcrumb renders, Home first. */
export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): WithContext<BreadcrumbListLd> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/* ------------------------------------------------------------------------------------------
 * Articles (guides and journal)
 * ---------------------------------------------------------------------------------------- */

export interface ArticleJsonLdInput {
  /** "Article" for pillar guides, "BlogPosting" for journal entries. */
  type?: "Article" | "BlogPosting";
  headline: string;
  description: string;
  path: string;
  images: readonly string[];
  /** ISO 8601 date-times. */
  datePublished: string;
  dateModified?: string;
  /** Named author (e.g. a weaver or writer); falls back to the organisation. */
  author?: { name: string; url?: string };
  section?: string;
}

export function articleJsonLd(input: ArticleJsonLdInput): WithContext<ArticleLd> {
  const url = absoluteUrl(input.path);
  return compact({
    "@context": SCHEMA_CONTEXT,
    "@type": input.type ?? "Article",
    "@id": `${url}#article`,
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: url,
    image: absoluteUrls(input.images),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: siteConfig.locale,
    author: input.author
      ? compact({
          "@type": "Person" as const,
          name: input.author.name,
          url: input.author.url ? absoluteUrl(input.author.url) : undefined,
        })
      : { "@type": "Organization" as const, "@id": organizationId(), name: siteConfig.name },
    publisher: {
      "@type": "Organization" as const,
      "@id": organizationId(),
      name: siteConfig.name,
      logo: logo(),
    },
    articleSection: input.section,
  });
}

/* ------------------------------------------------------------------------------------------
 * FAQ
 * ---------------------------------------------------------------------------------------- */

export interface FaqItem {
  question: string;
  /** Plain text or simple HTML (links, lists), exactly as shown on the page. */
  answer: string;
}

/**
 * FAQPage for the visible FAQ block. Google requires the Q&A to be visible on the page, so
 * only call this where the FAQ section is rendered; returns null for an empty list.
 */
export function faqPageJsonLd(faqs: readonly FaqItem[]): WithContext<FaqPageLd> | null {
  if (faqs.length === 0) return null;
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/**
 * Questions and answers from CMS rich text written as "<h2>Question</h2>" followed by the
 * answer, which is how the FAQ page is edited in the admin. Answers become plain text.
 */
export function faqItemsFromHtml(html: string): FaqItem[] {
  const plain = (s: string) =>
    s
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
  return html
    .split(/<h2[^>]*>/i)
    .slice(1)
    .map((chunk) => {
      const [question = "", answer = ""] = chunk.split(/<\/h2>/i);
      return { question: plain(question), answer: plain(answer) };
    })
    .filter((f) => f.question.length > 0 && f.answer.length > 0);
}

/* ------------------------------------------------------------------------------------------
 * Web pages (about, help, legal, contact)
 * ---------------------------------------------------------------------------------------- */

export interface WebPageJsonLdInput {
  path: string;
  name: string;
  description?: string;
  type?: WebPageLd["@type"];
  /** ISO 8601. */
  dateModified?: string;
}

/** WebPage node tied to the site and the organisation, for pages without a richer type. */
export function webPageJsonLd(input: WebPageJsonLdInput): WithContext<WebPageLd> {
  const url = absoluteUrl(input.path);
  return compact({
    "@context": SCHEMA_CONTEXT,
    "@type": input.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: input.name,
    description: input.description,
    inLanguage: siteConfig.locale,
    isPartOf: { "@id": websiteId() },
    about: input.type === "AboutPage" ? { "@id": organizationId() } : undefined,
    dateModified: input.dateModified,
  });
}

/* ------------------------------------------------------------------------------------------
 * Bhagalpur store (LocalBusiness)
 * ---------------------------------------------------------------------------------------- */

export type DayOfWeek =
  "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface StoreDetails {
  /** Page that describes the shop; defaults to /contact. */
  path?: string;
  name?: string;
  /** Defaults to siteConfig.contact (the registered Bhagalpur address). */
  streetAddress?: string;
  postalCode?: string;
  telephone?: string;
  geo?: { latitude: number; longitude: number };
  /** 24-hour "HH:MM" local time. */
  openingHours?: readonly { days: readonly DayOfWeek[]; opens: string; closes: string }[];
  images?: readonly string[];
  /** Google Maps / Business Profile URL. */
  mapUrl?: string;
  priceRange?: string;
}

/** ClothingStore (a LocalBusiness subtype) for the Bhagalpur shop and Google Business Profile. */
export function storeJsonLd(details: StoreDetails = {}): WithContext<ClothingStoreLd> {
  const url = absoluteUrl(details.path ?? routes.contact);
  return compact({
    "@context": SCHEMA_CONTEXT,
    "@type": "ClothingStore" as const,
    "@id": `${url}#store`,
    name: details.name ?? siteConfig.name,
    url,
    image: details.images?.length ? absoluteUrls(details.images) : [absoluteUrl(LOGO_PATH)],
    telephone: publishablePhone(details.telephone ?? siteConfig.contact.phone),
    email: siteConfig.contact.email,
    address: bhagalpurAddress(details.streetAddress, details.postalCode),
    geo: details.geo
      ? {
          "@type": "GeoCoordinates" as const,
          latitude: details.geo.latitude,
          longitude: details.geo.longitude,
        }
      : undefined,
    openingHoursSpecification: details.openingHours?.map((h) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    hasMap: details.mapUrl,
    priceRange: details.priceRange,
    parentOrganization: { "@id": organizationId() },
  });
}
