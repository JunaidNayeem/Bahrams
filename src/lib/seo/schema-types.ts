/**
 * Minimal schema.org shapes for the structured data this site emits. Hand-written instead of
 * pulling in schema-dts: we only need the properties Google's rich results actually read.
 */

export const SCHEMA_CONTEXT = "https://schema.org";
export type SchemaContext = typeof SCHEMA_CONTEXT;

/** A top-level JSON-LD document: anything with @context and @type can be rendered. */
export interface JsonLdDocument {
  "@context": SchemaContext;
  "@type": string | readonly string[];
}

export type WithContext<T> = T & { "@context": SchemaContext };

export interface NodeRef {
  "@id": string;
}

export interface ImageObjectLd {
  "@type": "ImageObject";
  url: string;
  width?: number;
  height?: number;
}

export interface PostalAddressLd {
  "@type": "PostalAddress";
  streetAddress?: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  addressCountry: string;
}

export interface ContactPointLd {
  "@type": "ContactPoint";
  contactType: string;
  email?: string;
  telephone?: string;
  areaServed: string;
  availableLanguage: readonly string[];
}

export interface OrganizationLd {
  "@type": "Organization";
  "@id": string;
  name: string;
  url: string;
  logo: ImageObjectLd;
  description: string;
  sameAs: readonly string[];
  contactPoint: readonly ContactPointLd[];
  address: PostalAddressLd;
  foundingDate?: string;
}

export interface SearchActionLd {
  "@type": "SearchAction";
  target: { "@type": "EntryPoint"; urlTemplate: string };
  "query-input": string;
}

export interface WebSiteLd {
  "@type": "WebSite";
  "@id": string;
  url: string;
  name: string;
  inLanguage: string;
  publisher: NodeRef;
  potentialAction: SearchActionLd;
}

export interface ListItemLd {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbListLd {
  "@type": "BreadcrumbList";
  itemListElement: readonly ListItemLd[];
}

export interface MonetaryAmountLd {
  "@type": "MonetaryAmount";
  value: string;
  currency: string;
}

export interface QuantitativeValueLd {
  "@type": "QuantitativeValue";
  value?: number;
  minValue?: number;
  maxValue?: number;
  unitCode: string;
}

export interface OfferShippingDetailsLd {
  "@type": "OfferShippingDetails";
  shippingRate: MonetaryAmountLd;
  shippingDestination: { "@type": "DefinedRegion"; addressCountry: string };
  deliveryTime: {
    "@type": "ShippingDeliveryTime";
    handlingTime: QuantitativeValueLd;
    transitTime: QuantitativeValueLd;
  };
}

export interface MerchantReturnPolicyLd {
  "@type": "MerchantReturnPolicy";
  applicableCountry: string;
  returnPolicyCountry: string;
  returnPolicyCategory: string;
  merchantReturnDays?: number;
  returnMethod?: string;
  returnFees?: string;
  refundType?: readonly string[];
  merchantReturnLink: string;
}

export interface UnitPriceSpecificationLd {
  "@type": "UnitPriceSpecification";
  price: string;
  priceCurrency: string;
  referenceQuantity: QuantitativeValueLd;
}

export interface OfferLd {
  "@type": "Offer";
  url: string;
  sku: string;
  price: string;
  priceCurrency: string;
  priceSpecification?: UnitPriceSpecificationLd;
  priceValidUntil?: string;
  availability: string;
  itemCondition: string;
  seller: NodeRef & { "@type": "Organization"; name: string };
  shippingDetails: OfferShippingDetailsLd;
  hasMerchantReturnPolicy: MerchantReturnPolicyLd;
}

export interface AggregateRatingLd {
  "@type": "AggregateRating";
  ratingValue: number;
  reviewCount: number;
  bestRating: number;
  worstRating: number;
}

export interface ReviewLd {
  "@type": "Review";
  author: { "@type": "Person"; name: string };
  datePublished: string;
  name?: string;
  reviewBody?: string;
  reviewRating: { "@type": "Rating"; ratingValue: number; bestRating: number; worstRating: number };
}

export interface PropertyValueLd {
  "@type": "PropertyValue";
  name: string;
  value: string;
}

export interface ProductLd {
  "@type": "Product";
  "@id": string;
  name: string;
  description: string;
  url: string;
  image: readonly string[];
  sku: string;
  brand: { "@type": "Brand"; name: string };
  material: string;
  color?: string;
  pattern?: string;
  category?: string;
  gtin?: string;
  mpn?: string;
  additionalProperty?: readonly PropertyValueLd[];
  offers: OfferLd;
  aggregateRating?: AggregateRatingLd;
  review?: readonly ReviewLd[];
}

export interface ProductGroupLd {
  "@type": "ProductGroup";
  "@id": string;
  name: string;
  description: string;
  url: string;
  image?: readonly string[];
  brand: { "@type": "Brand"; name: string };
  material?: string;
  productGroupID: string;
  variesBy: readonly string[];
  hasVariant: readonly ProductLd[];
  aggregateRating?: AggregateRatingLd;
  review?: readonly ReviewLd[];
}

export interface ArticleLd {
  "@type": "Article" | "BlogPosting";
  "@id": string;
  headline: string;
  description: string;
  url: string;
  mainEntityOfPage: string;
  image: readonly string[];
  datePublished: string;
  dateModified: string;
  inLanguage: string;
  author:
    | { "@type": "Person"; name: string; url?: string }
    | (NodeRef & { "@type": "Organization"; name: string });
  publisher: NodeRef & { "@type": "Organization"; name: string; logo: ImageObjectLd };
  articleSection?: string;
}

export interface FaqPageLd {
  "@type": "FAQPage";
  mainEntity: readonly {
    "@type": "Question";
    name: string;
    acceptedAnswer: { "@type": "Answer"; text: string };
  }[];
}

export interface OpeningHoursSpecificationLd {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: readonly string[];
  opens: string;
  closes: string;
}

export interface ClothingStoreLd {
  "@type": "ClothingStore";
  "@id": string;
  name: string;
  url: string;
  image?: readonly string[];
  telephone?: string;
  email?: string;
  address: PostalAddressLd;
  geo?: { "@type": "GeoCoordinates"; latitude: number; longitude: number };
  openingHoursSpecification?: readonly OpeningHoursSpecificationLd[];
  hasMap?: string;
  priceRange?: string;
  parentOrganization: NodeRef;
}
