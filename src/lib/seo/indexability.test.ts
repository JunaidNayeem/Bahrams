import { describe, expect, it } from "vitest";
import {
  normalizeQueryString,
  pageFromSearchParams,
  resolveCollectionIndexability,
  type SearchParamsRecord,
} from "./indexability";

const BASE = "/sarees/tussar-silk";

describe("resolveCollectionIndexability", () => {
  const cases: [
    string,
    SearchParamsRecord,
    { canonical: string; noindex: boolean; reason: string },
  ][] = [
    ["bare collection", {}, { canonical: BASE, noindex: false, reason: "base" }],
    [
      "tracking only",
      { utm_source: "ig", gclid: "x" },
      { canonical: BASE, noindex: false, reason: "base" },
    ],
    ["sort only", { sort: "price-asc" }, { canonical: BASE, noindex: false, reason: "sorted" }],
    ["page 1", { page: "1" }, { canonical: BASE, noindex: false, reason: "base" }],
    [
      "page 2 is self-canonical",
      { page: "2" },
      { canonical: `${BASE}?page=2`, noindex: false, reason: "paginated" },
    ],
    [
      "page 3 sorted",
      { page: "3", sort: "newest" },
      { canonical: `${BASE}?page=3`, noindex: false, reason: "paginated" },
    ],
    [
      "one colour",
      { colour: "Red" },
      { canonical: `${BASE}?colour=red`, noindex: false, reason: "single_facet" },
    ],
    [
      "one fibre",
      { fibre: "ghicha" },
      { canonical: `${BASE}?fibre=ghicha`, noindex: false, reason: "single_facet" },
    ],
    [
      "colour + sort",
      { colour: "red", sort: "price-desc" },
      { canonical: `${BASE}?colour=red`, noindex: false, reason: "single_facet" },
    ],
    [
      "colour + page 2",
      { colour: "red", page: "2" },
      { canonical: `${BASE}?colour=red&page=2`, noindex: false, reason: "paginated" },
    ],
    [
      "same colour twice",
      { colour: ["red", "RED"] },
      { canonical: `${BASE}?colour=red`, noindex: false, reason: "single_facet" },
    ],
    [
      "two colours",
      { colour: ["red", "gold"] },
      { canonical: BASE, noindex: true, reason: "multiple_facets" },
    ],
    [
      "comma colours",
      { colour: "red,gold" },
      { canonical: BASE, noindex: true, reason: "multiple_facets" },
    ],
    [
      "colour + fibre",
      { colour: "red", fibre: "tussar" },
      { canonical: BASE, noindex: true, reason: "multiple_facets" },
    ],
    [
      "non-whitelisted facet",
      { occasion: "wedding" },
      { canonical: BASE, noindex: true, reason: "non_whitelisted_param" },
    ],
    [
      "price filter + colour",
      { colour: "red", price_max: "5000" },
      { canonical: BASE, noindex: true, reason: "non_whitelisted_param" },
    ],
    ["invalid page", { page: "abc" }, { canonical: BASE, noindex: true, reason: "invalid_page" }],
    ["page 0", { page: "0" }, { canonical: BASE, noindex: true, reason: "invalid_page" }],
    [
      "empty values ignored",
      { colour: "", page: "" },
      { canonical: BASE, noindex: false, reason: "base" },
    ],
  ];

  it.each(cases)("%s", (_label, params, expected) => {
    const result = resolveCollectionIndexability(BASE, params);
    expect({ canonical: result.canonical, noindex: result.noindex, reason: result.reason }).toEqual(
      expected,
    );
    expect(result.robots).toEqual({ index: !expected.noindex, follow: true });
  });

  it("respects a narrower facet whitelist", () => {
    const result = resolveCollectionIndexability(
      BASE,
      { fibre: "tussar" },
      { indexableFacets: ["colour"] },
    );
    expect(result).toMatchObject({
      canonical: BASE,
      noindex: true,
      reason: "non_whitelisted_param",
    });
  });

  it("noindexes empty listings", () => {
    expect(
      resolveCollectionIndexability(BASE, { colour: "teal" }, { resultCount: 0 }),
    ).toMatchObject({
      canonical: BASE,
      noindex: true,
      reason: "empty_results",
    });
  });

  it("accepts URLSearchParams and strips a trailing slash from the base", () => {
    const result = resolveCollectionIndexability(
      `${BASE}/`,
      new URLSearchParams("page=2&utm_medium=x"),
    );
    expect(result.canonical).toBe(`${BASE}?page=2`);
    expect(result.page).toBe(2);
  });
});

describe("normalizeQueryString", () => {
  it("drops tracking and empty params, dedupes and sorts", () => {
    expect(
      normalizeQueryString({
        sort: "newest",
        colour: ["red", "gold", "red"],
        utm_source: "x",
        q: " ",
      }),
    ).toBe("?colour=gold&colour=red&sort=newest");
  });

  it("supports keep/drop and lowercasing", () => {
    expect(
      normalizeQueryString(
        { Colour: "x", colour: "RED", page: "2" },
        { keep: ["colour"], lowercaseValues: true },
      ),
    ).toBe("?colour=red");
    expect(normalizeQueryString({ colour: "red", page: "2" }, { drop: ["page"] })).toBe(
      "?colour=red",
    );
    expect(normalizeQueryString({})).toBe("");
  });
});

describe("pageFromSearchParams", () => {
  it("reads valid pages and defaults everything else to 1", () => {
    expect(pageFromSearchParams({ page: "4" })).toBe(4);
    expect(pageFromSearchParams({ page: "-2" })).toBe(1);
    expect(pageFromSearchParams({ page: ["2", "3"] })).toBe(1);
    expect(pageFromSearchParams({})).toBe(1);
  });
});
