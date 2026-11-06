import { describe, expect, it } from "vitest";

import {
  designCodes,
  findVariantBySku,
  firstImageByVariant,
  imagesForVariant,
  productSkuOf,
  variantChoiceKind,
  variantLabel,
  variantPath,
  variesByOf,
} from "./variants";

const peacock = { sku: "TS-001-A", title: "Peacock border", colour: "Mustard" };
const temple = { sku: "TS-001-B", title: "Temple pallu", colour: "Mustard" };
const rust = { sku: "TS-002", title: null, colour: "Rust" };
const gold = { sku: "TS-003", title: null, colour: "Gold" };

describe("variantLabel", () => {
  it("joins design and colour, falling back to the SKU", () => {
    expect(variantLabel(peacock)).toBe("Peacock border · Mustard");
    expect(variantLabel(rust)).toBe("Rust");
    expect(variantLabel({ sku: "X-1", title: null, colour: null })).toBe("X-1");
  });
});

describe("variantChoiceKind and variesByOf", () => {
  it("treats distinct names as designs", () => {
    expect(variantChoiceKind([peacock, temple])).toBe("design");
    expect(variesByOf([peacock, temple])).toEqual(["pattern"]);
  });

  it("treats colour-only variants as colours", () => {
    expect(variantChoiceKind([rust, gold])).toBe("colour");
    expect(variesByOf([rust, gold])).toEqual(["color"]);
  });

  it("reports both when design and colour vary", () => {
    expect(variesByOf([peacock, { ...temple, colour: "Rust" }])).toEqual(["pattern", "color"]);
  });
});

describe("imagesForVariant", () => {
  const images = [
    { url: "shared-1", variantId: null },
    { url: "a-1", variantId: "a" },
    { url: "b-1", variantId: "b" },
    { url: "a-2", variantId: "a" },
    { url: "shared-2" },
  ];

  it("shows the design's own photos first, then shared ones, never another design's", () => {
    expect(imagesForVariant(images, "a").map((i) => i.url)).toEqual([
      "a-1",
      "a-2",
      "shared-1",
      "shared-2",
    ]);
    expect(imagesForVariant(images, "b").map((i) => i.url)).not.toContain("a-1");
  });

  it("shows shared photos for a design without its own", () => {
    expect(imagesForVariant(images, "c").map((i) => i.url)).toEqual(["shared-1", "shared-2"]);
  });

  it("falls back to every photo rather than an empty gallery", () => {
    const onlyOthers = [{ url: "b-1", variantId: "b" }];
    expect(imagesForVariant(onlyOthers, "a").map((i) => i.url)).toEqual(["b-1"]);
  });

  it("finds each design's first photo", () => {
    const first = firstImageByVariant(images);
    expect(first.get("a")?.url).toBe("a-1");
    expect(first.get("b")?.url).toBe("b-1");
    expect(first.size).toBe(2);
  });
});

describe("variant URLs", () => {
  it("builds and resolves ?variant=<sku> case-insensitively", () => {
    expect(variantPath("/products/x", "TS-001-A")).toBe("/products/x?variant=ts-001-a");
    expect(findVariantBySku([peacock, temple], "ts-001-b")).toBe(temple);
    expect(findVariantBySku([peacock, temple], "nope")).toBeUndefined();
    expect(findVariantBySku([peacock, temple], null)).toBeUndefined();
  });
});

describe("one SKU per product", () => {
  it("gives a single design the product SKU itself", () => {
    expect(designCodes("LINEN-SAREE-0004", [null])).toEqual(["LINEN-SAREE-0004"]);
    expect(designCodes("LINEN-SAREE-0004", ["LINEN-SAREE-0004-D2"])).toEqual(["LINEN-SAREE-0004"]);
  });

  it("numbers several designs under the SKU", () => {
    expect(designCodes("TS-01", [null, null, null])).toEqual(["TS-01-D1", "TS-01-D2", "TS-01-D3"]);
  });

  it("keeps each design's number when one is removed or the SKU is renamed", () => {
    // Design 1 removed: the others keep D2 and D3.
    expect(designCodes("TS-01", ["TS-01-D2", "TS-01-D3"])).toEqual(["TS-01-D2", "TS-01-D3"]);
    expect(designCodes("TS-02", ["TS-01-D2", "TS-01-D3"])).toEqual(["TS-02-D2", "TS-02-D3"]);
  });

  it("gives new and old-style codes the lowest free number", () => {
    // A product that had one design (code = SKU) gains a second; older per-design SKUs migrate.
    expect(designCodes("LINEN-SAREE-0004", ["LINEN-SAREE-0004", null])).toEqual([
      "LINEN-SAREE-0004-D1",
      "LINEN-SAREE-0004-D2",
    ]);
    expect(designCodes("A-1", ["A-1-D2", "LINEN-SAREE-0005", null])).toEqual([
      "A-1-D2",
      "A-1-D1",
      "A-1-D3",
    ]);
  });

  it("never repeats a number", () => {
    expect(designCodes("A-1", ["A-1-D1", "A-1-D1"])).toEqual(["A-1-D1", "A-1-D2"]);
  });

  it("recovers the product SKU from a design code", () => {
    expect(productSkuOf("LINEN-SAREE-0004-D2")).toBe("LINEN-SAREE-0004");
    expect(productSkuOf("LINEN-SAREE-0004")).toBe("LINEN-SAREE-0004");
  });
});
