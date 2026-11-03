import { describe, expect, it } from "vitest";
import { siteOrigin } from "@/config/routes";
import { isValidGstin } from "@/lib/domain/tax";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqItemsFromHtml,
  faqPageJsonLd,
  organizationJsonLd,
  paiseToSchemaPrice,
  productGroupJsonLd,
  productJsonLd,
  serializeJsonLd,
  storeJsonLd,
  webPageJsonLd,
  websiteJsonLd,
  type ProductJsonLdInput,
  type ShippingPolicy,
} from "./jsonld";

const origin = siteOrigin();

const shipping: ShippingPolicy = {
  flatRatePaise: 9_900,
  freeAbovePaise: 300_000,
  handlingDays: { min: 1, max: 2 },
  transitDays: { min: 2, max: 7 },
};

const saree: ProductJsonLdInput = {
  name: "Rust tussar saree with ghicha pallu",
  slug: "rust-tussar-ghicha-pallu",
  description: "Tussar warp, ghicha weft.",
  images: ["/media/rust-1.jpg", "https://cdn.example.com/rust-2.jpg"],
  sku: "BS-TS-0001",
  pricePaise: 489_900,
  sellUnit: "piece",
  availability: "in_stock",
  material: "Tussar warp, ghicha weft",
  color: "Rust",
  shipping,
};

describe("paiseToSchemaPrice", () => {
  it("formats integer paise as a rupee string with two decimals", () => {
    expect(paiseToSchemaPrice(489_900)).toBe("4899.00");
    expect(paiseToSchemaPrice(5)).toBe("0.05");
    expect(paiseToSchemaPrice(0)).toBe("0.00");
    expect(paiseToSchemaPrice(123_456)).toBe("1234.56");
  });

  it("rejects fractional or negative paise", () => {
    expect(() => paiseToSchemaPrice(10.5)).toThrow(RangeError);
    expect(() => paiseToSchemaPrice(-1)).toThrow(RangeError);
  });
});

describe("serializeJsonLd", () => {
  it("cannot be broken out of a script tag and round-trips to the same data", () => {
    const doc = {
      "@context": "https://schema.org" as const,
      "@type": "Thing",
      name: '</script><script>alert("x")</script> & co\u2028',
    };
    const json = serializeJsonLd(doc);
    expect(json).not.toContain("<");
    expect(json).not.toContain(">");
    expect(json).not.toContain("\u2028");
    expect(json).toContain("\\u003c/script\\u003e");
    expect(JSON.parse(json)).toEqual(doc);
  });
});

describe("organizationJsonLd / websiteJsonLd", () => {
  it("describes the organisation with logo, sameAs and a contact point", () => {
    const org = organizationJsonLd();
    expect(org["@context"]).toBe("https://schema.org");
    expect(org["@type"]).toBe("Organization");
    expect(org["@id"]).toBe(`${origin}/#organization`);
    expect(org.logo.url).toMatch(/^https?:\/\//);
    expect(org.sameAs.length).toBeGreaterThan(0);
    expect(org.contactPoint[0]).toMatchObject({ "@type": "ContactPoint", areaServed: "IN" });
    expect(org.contactPoint[0].telephone).toBe("+91-9801616789");
    expect(org.address).toMatchObject({ addressLocality: "Bhagalpur", postalCode: "812005" });
  });

  it("names the registered seller with a valid Bihar GSTIN", () => {
    const org = organizationJsonLd();
    expect(org.legalName).toBe("Bahram Raw Silk");
    expect(org.alternateName).toContain("Bahram Raw Silk");
    expect(websiteJsonLd().alternateName).toEqual(org.alternateName);
    expect(isValidGstin(org.taxID)).toBe(true);
    expect(org.taxID.slice(0, 2)).toBe("10");
  });

  it("exposes a SearchAction on /search?q=", () => {
    const site = websiteJsonLd();
    expect(site.potentialAction.target.urlTemplate).toBe(`${origin}/search?q={search_term_string}`);
    expect(site.potentialAction["query-input"]).toBe("required name=search_term_string");
    expect(site.publisher["@id"]).toBe(`${origin}/#organization`);
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers items from 1 with absolute URLs", () => {
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Sarees", path: "/sarees" },
      { name: "Tussar silk", path: "/sarees/tussar-silk" },
    ]);
    expect(crumbs.itemListElement.map((i) => [i.position, i.item])).toEqual([
      [1, origin],
      [2, `${origin}/sarees`],
      [3, `${origin}/sarees/tussar-silk`],
    ]);
  });
});

describe("productJsonLd", () => {
  it("builds a Product with brand, material, absolute images and an INR offer", () => {
    const p = productJsonLd(saree);
    expect(p["@type"]).toBe("Product");
    expect(p.brand).toEqual({ "@type": "Brand", name: "Bahram Silks" });
    expect(p.material).toBe("Tussar warp, ghicha weft");
    expect(p.image).toEqual([`${origin}/media/rust-1.jpg`, "https://cdn.example.com/rust-2.jpg"]);
    expect(p.offers).toMatchObject({
      "@type": "Offer",
      url: `${origin}/products/rust-tussar-ghicha-pallu`,
      price: "4899.00",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${origin}/#organization` },
    });
    expect(p.offers.priceSpecification).toBeUndefined();
    expect(p.aggregateRating).toBeUndefined();
    expect(p.review).toBeUndefined();
  });

  it("maps availability, including made-to-order as PreOrder", () => {
    expect(productJsonLd({ ...saree, availability: "out_of_stock" }).offers.availability).toBe(
      "https://schema.org/OutOfStock",
    );
    expect(productJsonLd({ ...saree, availability: "made_to_order" }).offers.availability).toBe(
      "https://schema.org/PreOrder",
    );
  });

  it("includes India shipping details with free shipping above the threshold", () => {
    const details = productJsonLd(saree).offers.shippingDetails;
    expect(details.shippingDestination.addressCountry).toBe("IN");
    expect(details.shippingRate).toEqual({
      "@type": "MonetaryAmount",
      value: "0.00",
      currency: "INR",
    });
    expect(details.deliveryTime.handlingTime).toMatchObject({
      minValue: 1,
      maxValue: 2,
      unitCode: "DAY",
    });
    expect(details.deliveryTime.transitTime).toMatchObject({ minValue: 2, maxValue: 7 });

    const cheap = productJsonLd({ ...saree, pricePaise: 250_000 }).offers.shippingDetails;
    expect(cheap.shippingRate.value).toBe("99.00");

    const madeToOrder = productJsonLd({
      ...saree,
      availability: "made_to_order",
      handlingDays: { min: 14, max: 21 },
    }).offers.shippingDetails;
    expect(madeToOrder.deliveryTime.handlingTime).toMatchObject({ minValue: 14, maxValue: 21 });
  });

  it("includes the 7-day exchange-first return policy for pieces", () => {
    expect(productJsonLd(saree).offers.hasMerchantReturnPolicy).toEqual({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "IN",
      returnPolicyCountry: "IN",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
      refundType: [
        "https://schema.org/ExchangeRefund",
        "https://schema.org/StoreCreditRefund",
        "https://schema.org/FullRefund",
      ],
      merchantReturnLink: `${origin}/legal/returns-policy`,
    });
  });

  it("prices fabric per metre and marks custom-cut fabric as not returnable", () => {
    const fabric = productJsonLd({
      ...saree,
      slug: "matka-silk-natural",
      sellUnit: "metre",
      pricePaise: 85_000,
      material: "Matka silk",
    });
    expect(fabric.offers.priceSpecification).toEqual({
      "@type": "UnitPriceSpecification",
      price: "850.00",
      priceCurrency: "INR",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MTR" },
    });
    expect(fabric.offers.hasMerchantReturnPolicy.returnPolicyCategory).toBe(
      "https://schema.org/MerchantReturnNotPermitted",
    );
    expect(fabric.offers.hasMerchantReturnPolicy.merchantReturnDays).toBeUndefined();
  });

  it("adds AggregateRating and Review only when there are reviews", () => {
    expect(
      productJsonLd({ ...saree, rating: { average: 0, count: 0 } }).aggregateRating,
    ).toBeUndefined();
    const rated = productJsonLd({
      ...saree,
      rating: { average: 4.666, count: 3 },
      reviews: [
        { authorName: "Ananya", rating: 5, datePublished: "2026-10-02", body: "Lovely drape." },
      ],
    });
    expect(rated.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.7,
      reviewCount: 3,
      bestRating: 5,
      worstRating: 1,
    });
    expect(rated.review?.[0]).toMatchObject({
      "@type": "Review",
      author: { "@type": "Person", name: "Ananya" },
      reviewRating: { ratingValue: 5 },
      reviewBody: "Lovely drape.",
    });
  });

  it("lists only real proof records as additionalProperty", () => {
    const p = productJsonLd({
      ...saree,
      additionalProperties: [{ name: "Silk Mark label", value: "SM-12345" }],
    });
    expect(p.additionalProperty).toEqual([
      { "@type": "PropertyValue", name: "Silk Mark label", value: "SM-12345" },
    ]);
    expect(productJsonLd(saree).additionalProperty).toBeUndefined();
  });
});

describe("productGroupJsonLd", () => {
  it("groups colour variants with unique ids and keeps reviews on the group", () => {
    const group = productGroupJsonLd({
      name: "Tussar saree with ghicha pallu",
      slug: "tussar-ghicha-pallu",
      description: "Two colourways.",
      productGroupId: "BS-TS-0001",
      material: "Tussar silk",
      rating: { average: 5, count: 1 },
      variants: [
        { ...saree, sku: "BS-TS-0001-RUST", color: "Rust", rating: { average: 5, count: 9 } },
        { ...saree, sku: "BS-TS-0001-IVORY", color: "Ivory", availability: "out_of_stock" },
      ],
    });
    expect(group["@type"]).toBe("ProductGroup");
    expect(group.productGroupID).toBe("BS-TS-0001");
    expect(group.variesBy).toEqual(["https://schema.org/color"]);
    expect(group.hasVariant).toHaveLength(2);
    const ids = group.hasVariant.map((v) => v["@id"]);
    expect(new Set(ids).size).toBe(2);
    expect(group.hasVariant.every((v) => v.aggregateRating === undefined)).toBe(true);
    expect(group.hasVariant.every((v) => !("@context" in v))).toBe(true);
    expect(group.aggregateRating?.reviewCount).toBe(1);
  });
});

describe("articleJsonLd", () => {
  it("falls back to the organisation as author and to datePublished for dateModified", () => {
    const article = articleJsonLd({
      headline: "How to Verify Silk Mark",
      description: "Check the label number.",
      path: "/guides/how-to-verify-silk-mark",
      images: ["/media/silk-mark.jpg"],
      datePublished: "2026-10-01T09:00:00+05:30",
    });
    expect(article["@type"]).toBe("Article");
    expect(article.author).toMatchObject({
      "@type": "Organization",
      "@id": `${origin}/#organization`,
    });
    expect(article.dateModified).toBe(article.datePublished);
    expect(article.mainEntityOfPage).toBe(`${origin}/guides/how-to-verify-silk-mark`);
    expect(article.publisher.logo.url).toMatch(/^https?:\/\//);
  });

  it("supports a named author and BlogPosting for the journal", () => {
    const post = articleJsonLd({
      type: "BlogPosting",
      headline: "A season at the loom",
      description: "x",
      path: "/journal/a-season-at-the-loom",
      images: [],
      datePublished: "2026-10-01",
      author: { name: "Rekha Devi", url: "/weavers/rekha-devi" },
    });
    expect(post["@type"]).toBe("BlogPosting");
    expect(post.author).toEqual({
      "@type": "Person",
      name: "Rekha Devi",
      url: `${origin}/weavers/rekha-devi`,
    });
  });
});

describe("faqPageJsonLd", () => {
  it("returns null without FAQs and Question/Answer pairs otherwise", () => {
    expect(faqPageJsonLd([])).toBeNull();
    const faq = faqPageJsonLd([{ question: "Is tussar washable?", answer: "Dry clean first." }]);
    expect(faq?.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Is tussar washable?",
      acceptedAnswer: { "@type": "Answer", text: "Dry clean first." },
    });
  });
});

describe("storeJsonLd", () => {
  it("describes the Bhagalpur shop as a ClothingStore at the registered address", () => {
    const store = storeJsonLd();
    expect(store["@type"]).toBe("ClothingStore");
    expect(store.url).toBe(`${origin}/contact`);
    expect(store.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Hossainabad, Bounsi Road, Near Jama Masjid",
      addressLocality: "Bhagalpur",
      addressRegion: "Bihar",
      postalCode: "812005",
      addressCountry: "IN",
    });
    expect(store.telephone).toBe("+91-9801616789");
    expect(store.geo).toBeUndefined();
    expect(store.parentOrganization["@id"]).toBe(`${origin}/#organization`);
  });

  it("never publishes an all-zero placeholder phone", () => {
    expect(storeJsonLd({ telephone: "+91-00000-00000" }).telephone).toBeUndefined();
  });

  it("includes address, geo and opening hours once the client supplies them", () => {
    const store = storeJsonLd({
      streetAddress: "Khalifabagh Chowk",
      postalCode: "812002",
      telephone: "+91-98350-12345",
      geo: { latitude: 25.25, longitude: 86.98 },
      openingHours: [{ days: ["Monday", "Saturday"], opens: "10:00", closes: "20:00" }],
    });
    expect(store.address.postalCode).toBe("812002");
    expect(store.telephone).toBe("+91-98350-12345");
    expect(store.geo).toEqual({ "@type": "GeoCoordinates", latitude: 25.25, longitude: 86.98 });
    expect(store.openingHoursSpecification?.[0].dayOfWeek).toEqual(["Monday", "Saturday"]);
  });
});

describe("faqItemsFromHtml", () => {
  it("pairs each <h2> question with the content after it", () => {
    const html =
      "<p>Intro.</p><h2>Is your silk pure?</h2><p>Pure pieces carry a <a href='/x'>Silk Mark</a> label.</p>" +
      "<h2>Do you offer COD?</h2><p>Yes, up to ₹5,000.</p><ul><li>Fee shown upfront</li></ul><h2>Empty</h2>";
    expect(faqItemsFromHtml(html)).toEqual([
      { question: "Is your silk pure?", answer: "Pure pieces carry a Silk Mark label." },
      { question: "Do you offer COD?", answer: "Yes, up to ₹5,000. Fee shown upfront" },
    ]);
  });
});

describe("webPageJsonLd", () => {
  it("ties the page to the website and, for About pages, the organisation", () => {
    const page = webPageJsonLd({ path: "/our-story", name: "Our story", type: "AboutPage" });
    expect(page["@id"]).toBe(`${origin}/our-story#webpage`);
    expect(page.isPartOf).toEqual({ "@id": `${origin}/#website` });
    expect(page.about).toEqual({ "@id": `${origin}/#organization` });
    expect(webPageJsonLd({ path: "/legal/terms", name: "Terms" })).not.toHaveProperty("about");
  });
});
