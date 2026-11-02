import type { Fibre, ProductKind } from "../enums";
import { mulDivRoundHalfUp, roundHalfUp, sumPaise, type Paise } from "../money";
import { SELLER_GST_STATE_CODE } from "./states";

/**
 * GST on GST-inclusive retail prices. Rates follow the September 2025 rationalisation:
 * silk (5007), cotton (5208/5209) and linen (5309) woven fabrics, which include sarees, are 5%.
 * Made-up articles and apparel (chapters 61–63: stoles, kurtas, blouses, furnishings) are rated
 * by value per piece. TODO(client): confirm every rate and the apparel threshold with the CA.
 */

export type GstRateRule =
  | { kind: "flat"; ratePercent: number }
  | {
      kind: "value_threshold";
      /** Taxable value per piece at or below which the lower rate applies. */
      thresholdPaise: Paise;
      ratePercentAtOrBelow: number;
      ratePercentAbove: number;
    };

export const APPAREL_VALUE_THRESHOLD_PAISE: Paise = 250_000;

const APPAREL_RULE: GstRateRule = {
  kind: "value_threshold",
  thresholdPaise: APPAREL_VALUE_THRESHOLD_PAISE,
  ratePercentAtOrBelow: 5,
  ratePercentAbove: 18,
};

/** Keyed by HSN prefix (chapter or heading); the longest matching prefix wins. */
export const GST_RATE_RULES: Readonly<Record<string, GstRateRule>> = {
  "5007": { kind: "flat", ratePercent: 5 }, // woven silk fabric, silk sarees
  "5208": { kind: "flat", ratePercent: 5 }, // woven cotton ≤ 200 g/m², cotton sarees
  "5209": { kind: "flat", ratePercent: 5 }, // woven cotton > 200 g/m²
  "5309": { kind: "flat", ratePercent: 5 }, // woven linen
  "61": APPAREL_RULE, // knitted apparel
  "62": APPAREL_RULE, // woven apparel and accessories: kurtas, blouses, stoles (6214)
  "63": APPAREL_RULE, // made-up textile articles: furnishings (6302–6304)
};

export class UnknownHsnError extends Error {
  constructor(readonly hsn: string) {
    super(`No GST rate configured for HSN ${hsn}`);
    this.name = "UnknownHsnError";
  }
}

export function normaliseHsn(hsn: string): string {
  return hsn.replace(/\s+/g, "");
}

export function isValidHsnFormat(hsn: string): boolean {
  return /^(\d{4}|\d{6}|\d{8})$/.test(normaliseHsn(hsn));
}

export function findGstRule(
  hsn: string,
  rules: Readonly<Record<string, GstRateRule>> = GST_RATE_RULES,
): GstRateRule | null {
  const code = normaliseHsn(hsn);
  if (!isValidHsnFormat(code)) return null;
  for (let length = code.length; length >= 2; length--) {
    const rule = rules[code.slice(0, length)];
    if (rule) return rule;
  }
  return null;
}

/** Converts a rate such as 5 or 2.5 to basis points (500, 250) for exact integer maths. */
function basisPoints(ratePercent: number): number {
  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    throw new RangeError(`Invalid GST rate ${ratePercent}`);
  }
  return roundHalfUp(ratePercent * 100);
}

/** Taxable value inside a GST-inclusive amount. */
export function taxableValueOf(grossPaise: Paise, ratePercent: number): Paise {
  const bp = basisPoints(ratePercent);
  return mulDivRoundHalfUp(grossPaise, 10_000, 10_000 + bp);
}

/**
 * GST rate for one unit at a GST-inclusive price. For value-threshold rules the taxable value
 * is tested at the lower rate; a price whose taxable value exceeds the threshold at the lower
 * rate is charged the higher rate (see `isInThresholdGap` for the ambiguous band).
 */
export function resolveGstRate(
  hsn: string,
  unitPriceInclusivePaise: Paise,
  rules: Readonly<Record<string, GstRateRule>> = GST_RATE_RULES,
): number {
  const rule = findGstRule(hsn, rules);
  if (!rule) throw new UnknownHsnError(hsn);
  if (rule.kind === "flat") return rule.ratePercent;
  const taxableAtLower = taxableValueOf(unitPriceInclusivePaise, rule.ratePercentAtOrBelow);
  return taxableAtLower <= rule.thresholdPaise ? rule.ratePercentAtOrBelow : rule.ratePercentAbove;
}

/**
 * True for inclusive prices where the lower rate gives a taxable value above the threshold but
 * the higher rate gives one at or below it (₹2,625–₹2,950 at 5%/18%). Admin should warn: price
 * apparel outside this band.
 */
export function isInThresholdGap(rule: GstRateRule, unitPriceInclusivePaise: Paise): boolean {
  if (rule.kind === "flat") return false;
  return (
    taxableValueOf(unitPriceInclusivePaise, rule.ratePercentAtOrBelow) > rule.thresholdPaise &&
    taxableValueOf(unitPriceInclusivePaise, rule.ratePercentAbove) <= rule.thresholdPaise
  );
}

const SILK_HSN_FIBRES: readonly Fibre[] = [
  "tussar",
  "ghicha",
  "matka",
  "raw_silk",
  "mulberry",
  "eri",
  "noil",
];

/**
 * Default HSN for a new product. Returns null where classification depends on facts we do not
 * hold (blends are classified by the predominant fibre by weight), so staff must choose.
 */
export function suggestHsn(kind: ProductKind, fibre: Fibre): string | null {
  if (kind === "stole_dupatta") return "6214";
  if (kind === "home_furnishing") return "6304";
  if (SILK_HSN_FIBRES.includes(fibre)) return "5007";
  if (fibre === "cotton") return "5208";
  if (fibre === "linen") return "5309";
  return null;
}

export type SupplyType = "intra_state" | "inter_state";

export function supplyTypeFor(
  destinationStateCode: string,
  sellerStateCode: string = SELLER_GST_STATE_CODE,
): SupplyType {
  return destinationStateCode.padStart(2, "0") === sellerStateCode ? "intra_state" : "inter_state";
}

export interface GstSplit {
  ratePercent: number;
  grossPaise: Paise;
  taxablePaise: Paise;
  cgstPaise: Paise;
  sgstPaise: Paise;
  igstPaise: Paise;
  taxPaise: Paise;
}

/**
 * Splits a GST-inclusive amount. Always reconciles: taxable + tax === gross. Intra-state CGST
 * and SGST are equal halves; any rounding paisa is absorbed by the taxable value.
 */
export function splitGstInclusive(
  grossPaise: Paise,
  ratePercent: number,
  supply: SupplyType,
): GstSplit {
  const bp = basisPoints(ratePercent);
  const provisionalTaxable = mulDivRoundHalfUp(grossPaise, 10_000, 10_000 + bp);
  if (supply === "inter_state") {
    const igstPaise = grossPaise - provisionalTaxable;
    return {
      ratePercent,
      grossPaise,
      taxablePaise: provisionalTaxable,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise,
      taxPaise: igstPaise,
    };
  }
  const half = mulDivRoundHalfUp(provisionalTaxable, bp, 20_000);
  return {
    ratePercent,
    grossPaise,
    taxablePaise: grossPaise - 2 * half,
    cgstPaise: half,
    sgstPaise: half,
    igstPaise: 0,
    taxPaise: 2 * half,
  };
}

export interface InvoiceLineInput {
  id: string;
  hsn: string;
  /** GST-inclusive amount for the line after discounts and allocated charges. */
  grossPaise: Paise;
  ratePercent: number;
}

export type InvoiceLineTax = GstSplit & { id: string; hsn: string };

export interface GstTotals {
  grossPaise: Paise;
  taxablePaise: Paise;
  cgstPaise: Paise;
  sgstPaise: Paise;
  igstPaise: Paise;
  taxPaise: Paise;
}

export interface HsnSummaryRow extends GstTotals {
  hsn: string;
  ratePercent: number;
}

export interface InvoiceGst {
  supply: SupplyType;
  lines: InvoiceLineTax[];
  totals: GstTotals;
  /** Grouped by HSN and rate, for the invoice footer and the GSTR-1 HSN summary. */
  hsnSummary: HsnSummaryRow[];
}

export function sumGst(rows: readonly GstTotals[]): GstTotals {
  return {
    grossPaise: sumPaise(rows.map((r) => r.grossPaise)),
    taxablePaise: sumPaise(rows.map((r) => r.taxablePaise)),
    cgstPaise: sumPaise(rows.map((r) => r.cgstPaise)),
    sgstPaise: sumPaise(rows.map((r) => r.sgstPaise)),
    igstPaise: sumPaise(rows.map((r) => r.igstPaise)),
    taxPaise: sumPaise(rows.map((r) => r.taxPaise)),
  };
}

/** Per-line tax plus totals that are the sum of the lines, so the invoice reconciles to the paisa. */
export function computeInvoiceGst(
  lines: readonly InvoiceLineInput[],
  supply: SupplyType,
): InvoiceGst {
  const taxed: InvoiceLineTax[] = lines.map((line) => ({
    id: line.id,
    hsn: normaliseHsn(line.hsn),
    ...splitGstInclusive(line.grossPaise, line.ratePercent, supply),
  }));
  const groups = new Map<string, InvoiceLineTax[]>();
  for (const line of taxed) {
    const key = `${line.hsn}|${line.ratePercent}`;
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }
  const hsnSummary = [...groups.values()].map((group) => ({
    hsn: group[0].hsn,
    ratePercent: group[0].ratePercent,
    ...sumGst(group),
  }));
  return { supply, lines: taxed, totals: sumGst(taxed), hsnSummary };
}
