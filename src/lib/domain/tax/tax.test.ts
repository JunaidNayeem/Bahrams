import { describe, expect, it } from "vitest";
import {
  APPAREL_VALUE_THRESHOLD_PAISE,
  GST_RATE_RULES,
  INDIAN_STATES,
  SELLER_GST_STATE_CODE,
  UnknownHsnError,
  computeInvoiceGst,
  findGstRule,
  gstinCheckCharacter,
  isInThresholdGap,
  isIndianStateName,
  isValidGstStateCode,
  isValidGstin,
  isValidHsnFormat,
  parseGstin,
  resolveGstRate,
  splitGstInclusive,
  stateByCode,
  stateByName,
  suggestHsn,
  supplyTypeFor,
  taxableValueOf,
} from ".";

describe("Indian states", () => {
  it("lists all 28 states and 8 union territories with unique codes", () => {
    expect(INDIAN_STATES.filter((s) => s.kind === "state")).toHaveLength(28);
    expect(INDIAN_STATES.filter((s) => s.kind === "union_territory")).toHaveLength(8);
    expect(new Set(INDIAN_STATES.map((s) => s.code)).size).toBe(36);
  });

  it("looks up by code and by name", () => {
    expect(stateByCode("10")?.name).toBe("Bihar");
    expect(stateByCode("7")?.name).toBe("Delhi");
    expect(stateByName("  west   bengal ")?.code).toBe("19");
    expect(stateByName("Atlantis")).toBeUndefined();
    expect(isIndianStateName("Tamil Nadu")).toBe(true);
    expect(isIndianStateName("Madras")).toBe(false);
  });

  it("accepts legacy GSTIN state codes but not invented ones", () => {
    expect(isValidGstStateCode("10")).toBe(true);
    expect(isValidGstStateCode("97")).toBe(true);
    expect(isValidGstStateCode("25")).toBe(true);
    expect(isValidGstStateCode("39")).toBe(false);
    expect(isValidGstStateCode("00")).toBe(false);
  });

  it("puts the seller in Bihar", () => {
    expect(SELLER_GST_STATE_CODE).toBe("10");
  });
});

describe("GSTIN", () => {
  it("validates real-format GSTINs with correct checksums", () => {
    expect(isValidGstin("27AAPFU0939F1ZV")).toBe(true);
    expect(isValidGstin("29AAGCB7383J1Z4")).toBe(true);
    expect(isValidGstin(" 27aapfu0939f1zv ")).toBe(true);
  });

  it("computes the check character", () => {
    expect(gstinCheckCharacter("27AAPFU0939F1Z")).toBe("V");
    expect(() => gstinCheckCharacter("27AAPFU")).toThrow(RangeError);
    expect(() => gstinCheckCharacter("27AAPFU0939F1#")).toThrow(RangeError);
  });

  it.each([
    ["27AAPFU0939F1ZA", "wrong checksum"],
    ["27AAPFU0939F1Z", "too short"],
    ["27AAPFU0939F0ZV", "entity number 0"],
    ["27AAPFU0939F1YV", "missing Z"],
    ["40AAPFU0939F1ZV", "unknown state code"],
    ["2AAAPFU0939F1ZV", "bad state code"],
  ])("rejects %s (%s)", (gstin) => {
    expect(isValidGstin(gstin)).toBe(false);
  });

  it("parses into parts", () => {
    expect(parseGstin("27aapfu0939f1zv")).toEqual({
      gstin: "27AAPFU0939F1ZV",
      stateCode: "27",
      pan: "AAPFU0939F",
      entityNumber: "1",
    });
    expect(parseGstin("nonsense")).toBeNull();
  });
});

describe("GST rates", () => {
  it("rates silk, cotton and linen fabric (and sarees) at 5%", () => {
    for (const hsn of ["5007", "50072010", "5208", "520939", "5309"]) {
      expect(resolveGstRate(hsn, 1_200_000)).toBe(5);
    }
  });

  it("rates apparel and made-ups by value per piece", () => {
    expect(APPAREL_VALUE_THRESHOLD_PAISE).toBe(250_000);
    expect(resolveGstRate("6214", 250_000)).toBe(5); // stole at ₹2,500
    expect(resolveGstRate("6214", 262_500)).toBe(5); // taxable exactly ₹2,500 at 5%
    expect(resolveGstRate("6214", 262_501)).toBe(18);
    expect(resolveGstRate("62114200", 450_000)).toBe(18); // kurta
    expect(resolveGstRate("6304", 180_000)).toBe(5); // cushion cover
    expect(resolveGstRate("6109", 300_000)).toBe(18);
  });

  it("finds the longest matching prefix and supports custom rules", () => {
    expect(findGstRule("5007")).toEqual({ kind: "flat", ratePercent: 5 });
    expect(findGstRule("62")).toBeNull(); // not a valid HSN length
    expect(findGstRule("9999")).toBeNull();
    const custom = { ...GST_RATE_RULES, "6214": { kind: "flat", ratePercent: 12 } } as const;
    expect(resolveGstRate("6214", 100_000, custom)).toBe(12);
  });

  it("throws for unknown HSN codes", () => {
    expect(() => resolveGstRate("9999", 100)).toThrow(UnknownHsnError);
    expect(() => resolveGstRate("abc", 100)).toThrow(/No GST rate configured for HSN abc/);
  });

  it("validates HSN format", () => {
    expect(isValidHsnFormat("5007")).toBe(true);
    expect(isValidHsnFormat("500720")).toBe(true);
    expect(isValidHsnFormat("5007 2010")).toBe(true);
    expect(isValidHsnFormat("50072")).toBe(false);
  });

  it("flags inclusive prices in the ambiguous threshold band", () => {
    const rule = findGstRule("6214");
    if (!rule) throw new Error("expected apparel rule");
    expect(isInThresholdGap(rule, 262_500)).toBe(false);
    expect(isInThresholdGap(rule, 280_000)).toBe(true);
    expect(isInThresholdGap(rule, 295_000)).toBe(true);
    expect(isInThresholdGap(rule, 295_001)).toBe(false);
    expect(isInThresholdGap({ kind: "flat", ratePercent: 5 }, 280_000)).toBe(false);
  });

  it("suggests HSN by kind and fibre, leaving blends to staff", () => {
    expect(suggestHsn("saree", "tussar")).toBe("5007");
    expect(suggestHsn("fabric", "matka")).toBe("5007");
    expect(suggestHsn("saree", "cotton")).toBe("5208");
    expect(suggestHsn("fabric", "linen")).toBe("5309");
    expect(suggestHsn("stole_dupatta", "tussar")).toBe("6214");
    expect(suggestHsn("home_furnishing", "ghicha")).toBe("6304");
    expect(suggestHsn("saree", "cotton_silk")).toBeNull();
    expect(suggestHsn("dress_material", "blend")).toBeNull();
  });
});

describe("GST split of inclusive prices", () => {
  it("decides place of supply against Bihar", () => {
    expect(supplyTypeFor("10")).toBe("intra_state");
    expect(supplyTypeFor("27")).toBe("inter_state");
    expect(supplyTypeFor("7", "07")).toBe("intra_state");
  });

  it("splits intra-state into equal CGST and SGST", () => {
    expect(splitGstInclusive(480_000, 5, "intra_state")).toEqual({
      ratePercent: 5,
      grossPaise: 480_000,
      taxablePaise: 457_142,
      cgstPaise: 11_429,
      sgstPaise: 11_429,
      igstPaise: 0,
      taxPaise: 22_858,
    });
  });

  it("charges IGST inter-state", () => {
    expect(splitGstInclusive(480_000, 5, "inter_state")).toEqual({
      ratePercent: 5,
      grossPaise: 480_000,
      taxablePaise: 457_143,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 22_857,
      taxPaise: 22_857,
    });
  });

  it("always reconciles to the paisa", () => {
    for (const gross of [1, 99, 105, 12_345, 499_999, 1_234_567]) {
      for (const rate of [0, 5, 12, 18, 2.5]) {
        for (const supply of ["intra_state", "inter_state"] as const) {
          const split = splitGstInclusive(gross, rate, supply);
          expect(split.taxablePaise + split.taxPaise).toBe(gross);
          expect(split.cgstPaise + split.sgstPaise + split.igstPaise).toBe(split.taxPaise);
          expect(split.cgstPaise).toBe(split.sgstPaise);
        }
      }
    }
  });

  it("handles zero-rated amounts and rejects bad rates", () => {
    expect(splitGstInclusive(10_000, 0, "intra_state").taxPaise).toBe(0);
    expect(() => splitGstInclusive(10_000, -5, "intra_state")).toThrow(RangeError);
    expect(taxableValueOf(105, 5)).toBe(100);
  });
});

describe("computeInvoiceGst", () => {
  const lines = [
    { id: "a", hsn: "5007", grossPaise: 480_000, ratePercent: 5 },
    { id: "b", hsn: "5007", grossPaise: 129_950, ratePercent: 5 },
    { id: "c", hsn: "6214", grossPaise: 350_000, ratePercent: 18 },
  ];

  it("totals equal the sum of lines and the gross", () => {
    const invoice = computeInvoiceGst(lines, "intra_state");
    expect(invoice.totals.grossPaise).toBe(959_950);
    expect(invoice.totals.taxablePaise + invoice.totals.taxPaise).toBe(959_950);
    expect(invoice.totals.cgstPaise).toBe(invoice.lines.reduce((s, l) => s + l.cgstPaise, 0));
  });

  it("summarises by HSN and rate", () => {
    const invoice = computeInvoiceGst(lines, "inter_state");
    expect(invoice.hsnSummary).toHaveLength(2);
    const silk = invoice.hsnSummary.find((row) => row.hsn === "5007");
    expect(silk?.grossPaise).toBe(609_950);
    expect(silk?.igstPaise).toBe(invoice.lines[0].igstPaise + invoice.lines[1].igstPaise);
    expect(invoice.supply).toBe("inter_state");
  });

  it("handles an empty invoice", () => {
    expect(computeInvoiceGst([], "intra_state").totals.grossPaise).toBe(0);
  });
});
