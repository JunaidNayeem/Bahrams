import { describe, expect, it } from "vitest";

import { checkGradient, STRIPE_COLORWAYS, stripeGradient } from "./stripe-pattern";

describe("stripeGradient", () => {
  it("lays bands end to end with hard stops", () => {
    expect(
      stripeGradient([
        ["red", 4],
        ["gold", 2],
      ]),
    ).toBe("repeating-linear-gradient(90deg, red 0px 4px, gold 4px 6px)");
  });

  it("uses only design-token colours in every colourway", () => {
    for (const stops of Object.values(STRIPE_COLORWAYS)) {
      for (const [color] of stops) expect(color).toMatch(/^var\(--color-[a-z]+-\d+\)$/);
    }
  });
});

describe("checkGradient", () => {
  it("layers translucent weft stripes over the warp", () => {
    const value = checkGradient([["red", 4]]);
    expect(value).toBe(
      "repeating-linear-gradient(0deg, color-mix(in srgb, red 45%, transparent) 0px 4px), repeating-linear-gradient(90deg, red 0px 4px)",
    );
  });
});
