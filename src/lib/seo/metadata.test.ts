import { describe, expect, it } from "vitest";
import { siteOrigin } from "@/config/routes";
import {
  articleMetadata,
  buildMetadata,
  collectionMetadata,
  formatTitle,
  noindexMetadata,
  productMetadata,
  trimDescription,
} from "./metadata";

const origin = siteOrigin();

describe("trimDescription", () => {
  it("leaves short text alone and collapses whitespace and tags", () => {
    expect(trimDescription("  Tussar <b>silk</b>\n sarees ")).toBe("Tussar silk sarees");
  });

  it("cuts long text on a word boundary within the limit, with an ellipsis", () => {
    const text =
      "Tussar silk sarees in natural gold and copper hues, woven in Bhagalpur from wild silk, with warp and weft stated on every piece, cash on delivery and easy returns across India.";
    const out = trimDescription(text);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith("…")).toBe(true);
    expect(text.startsWith(out.slice(0, -1))).toBe(true);
    // Ends on a whole word, not mid-word.
    const lastWord = out.slice(0, -1).split(" ").pop()!;
    expect(text.split(/[\s,]+/)).toContain(lastWord);
  });

  it("drops trailing punctuation before the ellipsis", () => {
    expect(trimDescription("Tussar, matka, raw silk and more", 16)).toBe("Tussar, matka…");
  });

  it("hard-cuts a single overlong word", () => {
    const out = trimDescription("a".repeat(200), 20);
    expect(out).toBe(`${"a".repeat(19)}…`);
  });
});

describe("formatTitle", () => {
  it("appends the brand when it fits in 60 characters", () => {
    expect(formatTitle("Tussar Silk Sarees")).toBe("Tussar Silk Sarees | Bahram Silks");
  });

  it("skips the brand when too long or already present", () => {
    const long = "Silk Sarees from Bhagalpur: Tussar, Matka & Raw Silk Sarees";
    expect(formatTitle(long)).toBe(long);
    expect(formatTitle("Bahram Silks | Bhagalpur Silk")).toBe("Bahram Silks | Bhagalpur Silk");
    expect(formatTitle("Cart", false)).toBe("Cart");
  });
});

describe("buildMetadata", () => {
  it("emits absolute canonical, Open Graph, Twitter and index robots", () => {
    const meta = buildMetadata({
      title: "Tussar Silk Sarees",
      description: "Woven in Bhagalpur.",
      path: "/sarees/tussar-silk",
      image: { url: "/media/hero.jpg", alt: "Tussar saree", width: 1200, height: 630 },
    });
    expect(meta.title).toEqual({ absolute: "Tussar Silk Sarees | Bahram Silks" });
    expect(meta.alternates?.canonical).toBe(`${origin}/sarees/tussar-silk`);
    expect(meta.openGraph).toMatchObject({
      type: "website",
      siteName: "Bahram Silks",
      locale: "en_IN",
      url: `${origin}/sarees/tussar-silk`,
      images: [{ url: `${origin}/media/hero.jpg`, alt: "Tussar saree", width: 1200, height: 630 }],
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.robots).toMatchObject({ index: true, follow: true });
  });

  it("uses an explicit canonical and noindex,follow when asked", () => {
    const meta = buildMetadata({
      title: "Tussar Silk Sarees",
      description: "x",
      path: "/sarees/tussar-silk",
      canonical: "/sarees/tussar-silk",
      noindex: true,
    });
    expect(meta.alternates?.canonical).toBe(`${origin}/sarees/tussar-silk`);
    expect(meta.robots).toMatchObject({ index: false, follow: true });
  });

  it("falls back to the default share image", () => {
    const meta = buildMetadata({ title: "Our story", description: "x", path: "/our-story" });
    const images = (meta.openGraph as { images: { url: string }[] }).images;
    expect(images[0].url).toBe(`${origin}/og/default.jpg`);
  });

  it("canonicalises the home page without a trailing slash", () => {
    expect(
      buildMetadata({ title: "Home", description: "x", path: "/" }).alternates?.canonical,
    ).toBe(origin);
  });
});

describe("page helpers", () => {
  it("collectionMetadata falls back to the keyword map and numbers paginated titles", () => {
    const meta = collectionMetadata({ path: "/sarees/tussar-silk", name: "Tussar silk", page: 2 });
    expect(meta.title).toEqual({ absolute: "Tussar Silk Sarees, Woven in Bhagalpur – Page 2" });
    expect(meta.description).toMatch(/^Tussar silk sarees in natural gold/);
  });

  it("collectionMetadata prefers admin SEO fields", () => {
    const meta = collectionMetadata({
      path: "/sarees/tussar-silk",
      name: "Tussar silk",
      seoTitle: "Festive Tussar",
      seoDescription: "Custom copy.",
    });
    expect(meta.title).toEqual({ absolute: "Festive Tussar | Bahram Silks" });
    expect(meta.description).toBe("Custom copy.");
  });

  it("productMetadata builds a specific fallback title and description", () => {
    const meta = productMetadata({
      name: "Rust ghicha pallu",
      slug: "rust-ghicha-pallu",
      productType: "Tussar silk saree",
    });
    expect(meta.title).toEqual({ absolute: "Rust ghicha pallu, Tussar silk saree | Bahram Silks" });
    expect(meta.description).toContain("woven in Bhagalpur");
    expect(meta.alternates?.canonical).toBe(`${origin}/products/rust-ghicha-pallu`);
  });

  it("articleMetadata uses article Open Graph with dates", () => {
    const meta = articleMetadata({
      path: "/guides/saree-care",
      title: "Saree Care",
      description: "How to look after silk.",
      publishedAt: "2026-10-01T00:00:00Z",
    });
    expect(meta.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-10-01T00:00:00Z",
    });
    expect(meta.title).toEqual({
      absolute: "Silk Saree Care: Washing, Storing & Ironing | Bahram Silks",
    });
  });

  it("noindexMetadata keeps private pages out of the index", () => {
    expect(noindexMetadata("Your cart", "/cart").robots).toMatchObject({ index: false });
  });
});
