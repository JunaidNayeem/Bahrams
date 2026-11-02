import { describe, expect, it } from "vitest";
import { FIBRES } from "../enums";
import {
  CLAIM_BADGE_LABELS,
  FIBRE_LABELS,
  SILK_FIBRES,
  compositionLabel,
  compositionPercentLabel,
  computeClaims,
  giDisplayName,
  isPureSilkComposition,
  isSilkFibre,
  normaliseLabelNumber,
  type ProductClaimFacts,
} from ".";

const pureTussar: ProductClaimFacts = {
  composition: [{ fibre: "tussar", percent: 100 }],
  silkMarkLabelNumber: "SM-123456",
  handloomMarkLabelNumber: "HLM-98765",
  giEligible: true,
};

describe("computeClaims", () => {
  it("renders every badge when every record exists", () => {
    expect(computeClaims(pureTussar)).toEqual({
      badges: ["pure_silk", "silk_mark", "handloom", "gi_bhagalpur"],
      pureSilk: true,
      silkMarkLabelNumber: "SM-123456",
      handloomMarkLabelNumber: "HLM-98765",
      originLabel: "Bhagalpur Silk (GI)",
    });
  });

  it("makes no certification claim without a record", () => {
    const bare = computeClaims({
      composition: [{ fibre: "tussar", percent: 100 }],
      giEligible: false,
    });
    expect(bare.badges).toEqual(["woven_in_bhagalpur"]);
    expect(bare.pureSilk).toBe(false);
    expect(bare.silkMarkLabelNumber).toBeNull();
    expect(bare.originLabel).toBe("Woven in Bhagalpur");
  });

  it("never says Pure Silk without a Silk Mark label, even for 100% silk", () => {
    for (const label of [null, undefined, "", "   "]) {
      const claims = computeClaims({ ...pureTussar, silkMarkLabelNumber: label });
      expect(claims.badges).not.toContain("pure_silk");
      expect(claims.badges).not.toContain("silk_mark");
    }
  });

  it("never says Pure Silk for a blend, even with a Silk Mark label", () => {
    const blend = computeClaims({
      ...pureTussar,
      composition: [
        { fibre: "tussar", percent: 70 },
        { fibre: "cotton", percent: 30 },
      ],
    });
    expect(blend.badges).toEqual(["silk_mark", "handloom", "gi_bhagalpur"]);
    expect(blend.pureSilk).toBe(false);
  });

  it("shows Handloom only with a Handloom Mark label", () => {
    expect(computeClaims({ ...pureTussar, handloomMarkLabelNumber: null }).badges).not.toContain(
      "handloom",
    );
  });

  it("shows GI only when the flag is set; otherwise 'Woven in Bhagalpur'", () => {
    const nonGi = computeClaims({ ...pureTussar, giEligible: false });
    expect(nonGi.badges).toContain("woven_in_bhagalpur");
    expect(nonGi.badges).not.toContain("gi_bhagalpur");
  });

  it("drops the origin badge for pieces not woven in the cluster", () => {
    const elsewhere = computeClaims({ ...pureTussar, wovenInBhagalpur: false });
    expect(elsewhere.originLabel).toBeNull();
    expect(elsewhere.badges).toEqual(["pure_silk", "silk_mark", "handloom"]);
  });

  it("normalises label numbers", () => {
    expect(
      computeClaims({ ...pureTussar, silkMarkLabelNumber: "  sm   123 " }).silkMarkLabelNumber,
    ).toBe("SM 123");
  });
});

describe("composition", () => {
  it("is pure silk only at exactly 100% silk fibres", () => {
    expect(isPureSilkComposition([{ fibre: "matka", percent: 100 }])).toBe(true);
    expect(
      isPureSilkComposition([
        { fibre: "tussar", percent: 60 },
        { fibre: "ghicha", percent: 40 },
      ]),
    ).toBe(true);
    expect(
      isPureSilkComposition([
        { fibre: "tussar", percent: 100 },
        { fibre: "cotton", percent: 0 },
      ]),
    ).toBe(true);
    expect(isPureSilkComposition([])).toBe(false);
    expect(isPureSilkComposition([{ fibre: "tussar", percent: 90 }])).toBe(false);
    expect(isPureSilkComposition([{ fibre: "cotton_silk", percent: 100 }])).toBe(false);
    expect(isPureSilkComposition([{ fibre: "tussar", percent: Number.NaN }])).toBe(false);
    expect(
      isPureSilkComposition([
        { fibre: "tussar", percent: 110 },
        { fibre: "eri", percent: -10 },
      ]),
    ).toBe(false);
  });

  it("classifies silk fibres honestly", () => {
    expect(SILK_FIBRES).toEqual([
      "tussar",
      "ghicha",
      "matka",
      "raw_silk",
      "mulberry",
      "eri",
      "noil",
    ]);
    expect(isSilkFibre("cotton_silk")).toBe(false);
    expect(isSilkFibre("blend")).toBe(false);
    for (const fibre of FIBRES) expect(FIBRE_LABELS[fibre]).toBeTruthy();
  });

  it("labels warp and weft", () => {
    expect(compositionLabel("tussar", "ghicha")).toBe("Tussar warp, ghicha weft");
    expect(compositionLabel("raw_silk", "cotton")).toBe("Raw silk warp, cotton weft");
    expect(compositionLabel("matka", "matka")).toBe("Matka warp and weft");
    expect(compositionLabel("tussar", null)).toBe("Tussar warp");
    expect(compositionLabel(null, "linen")).toBe("Linen weft");
    expect(compositionLabel(null, null)).toBeNull();
  });

  it("labels percentage compositions, largest first", () => {
    expect(
      compositionPercentLabel([
        { fibre: "cotton", percent: 30 },
        { fibre: "tussar", percent: 70 },
      ]),
    ).toBe("70% tussar, 30% cotton");
    expect(compositionPercentLabel([{ fibre: "eri", percent: 0 }])).toBeNull();
  });
});

describe("labels", () => {
  it("names the origin by GI status", () => {
    expect(giDisplayName(true)).toBe("Bhagalpur Silk (GI)");
    expect(giDisplayName(false)).toBe("Woven in Bhagalpur");
    expect(CLAIM_BADGE_LABELS.gi_bhagalpur).toBe("Bhagalpur Silk (GI)");
  });

  it("treats blank label numbers as missing", () => {
    expect(normaliseLabelNumber(undefined)).toBeNull();
    expect(normaliseLabelNumber("\t")).toBeNull();
    expect(normaliseLabelNumber("abc")).toBe("ABC");
  });
});
