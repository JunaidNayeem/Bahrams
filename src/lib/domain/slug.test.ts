import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it.each([
    ["Tussar Silk", "tussar-silk"],
    ["  Matka Silk — Natural Gold  ", "matka-silk-natural-gold"],
    ["Zari & Bridal", "zari-and-bridal"],
    ["Weaver's Choice", "weavers-choice"],
    ["Kantha Café", "kantha-cafe"],
    ["Ghicha/Tussar 5.5m saree!!", "ghicha-tussar-5-5m-saree"],
    ["भागलपुरी Tussar साड़ी", "tussar"],
  ])("slugifies %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("strips non-Latin text entirely and can fall back", () => {
    expect(slugify("भागलपुरी साड़ी")).toBe("");
    expect(slugify("भागलपुरी साड़ी", { fallback: "saree" })).toBe("saree");
  });

  it("truncates at a word boundary", () => {
    expect(slugify("bhagalpur tussar silk saree with zari border", { maxLength: 20 })).toBe(
      "bhagalpur-tussar",
    );
    expect(slugify("supercalifragilistic", { maxLength: 5 })).toBe("super");
  });

  it("produces valid slugs", () => {
    expect(isValidSlug(slugify("Raw Silk -- Fabric"))).toBe(true);
    expect(isValidSlug("raw--silk")).toBe(false);
    expect(isValidSlug("-raw")).toBe(false);
    expect(isValidSlug("Raw")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("returns the base when free", () => {
    expect(uniqueSlug("tussar-silk", [])).toBe("tussar-silk");
  });

  it("adds the first free numeric suffix", () => {
    expect(uniqueSlug("tussar-silk", ["tussar-silk", "tussar-silk-2"])).toBe("tussar-silk-3");
    expect(uniqueSlug("tussar-silk", (slug) => slug === "tussar-silk")).toBe("tussar-silk-2");
  });

  it("keeps suffixed slugs within the length limit", () => {
    const slug = uniqueSlug("bhagalpur-tussar", ["bhagalpur-tussar"], 16);
    expect(slug).toBe("bhagalpur-2");
    expect(slug.length).toBeLessThanOrEqual(16);
  });

  it("refuses an empty base and gives up eventually", () => {
    expect(() => uniqueSlug("", [])).toThrow(RangeError);
    expect(() => uniqueSlug("a", () => true)).toThrow(/No free slug/);
  });
});
