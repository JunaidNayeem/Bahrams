import { describe, expect, it } from "vitest";

import { PLACEHOLDER_SLUG, slugParamsOrPlaceholder } from "./static-params";

describe("slugParamsOrPlaceholder", () => {
  it("maps slugs to params", () => {
    expect(slugParamsOrPlaceholder(["a", "b"])).toEqual([{ slug: "a" }, { slug: "b" }]);
  });

  it("returns one placeholder for an empty list, so the build does not fail", () => {
    expect(slugParamsOrPlaceholder([])).toEqual([{ slug: PLACEHOLDER_SLUG }]);
  });

  it("uses a placeholder that can never be a real slug", () => {
    expect(PLACEHOLDER_SLUG).not.toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});
