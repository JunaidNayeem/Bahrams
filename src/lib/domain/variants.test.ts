import { describe, expect, it } from "vitest";

import {
  findVariantBySku,
  firstImageByVariant,
  imagesForVariant,
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
