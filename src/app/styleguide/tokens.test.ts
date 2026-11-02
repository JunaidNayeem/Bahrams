import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { contrastRatio, formatRatio } from "./contrast";
import {
  CONTRAST_MINIMUM,
  CONTRAST_PAIRS,
  PALETTE,
  SEMANTIC,
  resolveToken,
  type PaletteName,
} from "./tokens";

const css = readFileSync(fileURLToPath(new URL("../globals.css", import.meta.url)), "utf8");

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
  });

  it("formats without overstating", () => {
    expect(formatRatio(4.499)).toBe("4.49:1");
  });
});

describe("tokens.ts mirrors globals.css", () => {
  for (const name of Object.keys(PALETTE) as PaletteName[]) {
    for (const [step, hex] of Object.entries(PALETTE[name])) {
      it(`--color-${name}-${step} is ${hex}`, () => {
        expect(css).toContain(`--color-${name}-${step}: ${hex};`);
      });
    }
  }

  for (const [token, ref] of Object.entries(SEMANTIC)) {
    it(`--${token} maps to ${ref}`, () => {
      expect(css).toContain(`--${token}: var(--color-${ref});`);
      expect(css).toContain(`--color-${token}: var(--${token});`);
    });
  }
});

describe("contrast pairs meet WCAG 2.2 AA", () => {
  for (const pair of CONTRAST_PAIRS) {
    const ratio = contrastRatio(resolveToken(pair.fg), resolveToken(pair.bg));
    it(`${pair.fg} on ${pair.bg} (${pair.use}) = ${formatRatio(ratio)}`, () => {
      expect(ratio).toBeGreaterThanOrEqual(CONTRAST_MINIMUM[pair.kind]);
    });
  }

  it("decorative zari gold is NOT text-safe, so gold-text exists", () => {
    expect(contrastRatio(resolveToken("zari"), resolveToken("background"))).toBeLessThan(4.5);
    expect(
      contrastRatio(resolveToken("gold-text"), resolveToken("background")),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
