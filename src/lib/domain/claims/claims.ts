import type { Fibre } from "../enums";
import { fibreLabel, isSilkFibre } from "./fibres";

/**
 * Labels are claims. A badge renders only when the record behind it exists: a Silk Mark label
 * number, a Handloom Mark label number, or the GI-eligibility flag set by staff. "Pure Silk"
 * needs both a 100% silk composition and a Silk Mark label. Without the GI flag we say
 * "Woven in Bhagalpur", never "Bhagalpur Silk (GI)".
 */

export type ClaimBadge =
  "pure_silk" | "silk_mark" | "handloom" | "gi_bhagalpur" | "woven_in_bhagalpur";

export const CLAIM_BADGE_LABELS: Readonly<Record<ClaimBadge, string>> = {
  pure_silk: "Pure Silk",
  silk_mark: "Silk Mark certified",
  handloom: "Handloom Mark",
  gi_bhagalpur: "Bhagalpur Silk (GI)",
  woven_in_bhagalpur: "Woven in Bhagalpur",
};

export const GI_DISPLAY_NAME = "Bhagalpur Silk (GI)";
export const NON_GI_ORIGIN_LABEL = "Woven in Bhagalpur";

/** TODO(client): replace with the label-verification deep link once Bahram is an authorised user. */
export const SILK_MARK_VERIFY_URL = "https://silkmarkindia.com/";

export interface FibreShare {
  fibre: Fibre;
  /** Percentage by weight, 0–100. */
  percent: number;
}

export interface ProductClaimFacts {
  composition: readonly FibreShare[];
  silkMarkLabelNumber?: string | null;
  handloomMarkLabelNumber?: string | null;
  giEligible: boolean;
  /** Set false for a piece not woven in the cluster; suppresses the origin badge entirely. */
  wovenInBhagalpur?: boolean;
}

export interface ProductClaims {
  badges: ClaimBadge[];
  pureSilk: boolean;
  silkMarkLabelNumber: string | null;
  handloomMarkLabelNumber: string | null;
  /** "Bhagalpur Silk (GI)" or "Woven in Bhagalpur"; null when neither may be said. */
  originLabel: string | null;
}

/** Trims and upper-cases a label number; blank or whitespace-only means "no label". */
export function normaliseLabelNumber(value: string | null | undefined): string | null {
  const cleaned = (value ?? "").trim().replace(/\s+/g, " ").toUpperCase();
  return cleaned === "" ? null : cleaned;
}

/** True only for a composition recorded as exactly 100% silk fibres. */
export function isPureSilkComposition(composition: readonly FibreShare[]): boolean {
  if (composition.length === 0) return false;
  let total = 0;
  for (const share of composition) {
    if (!Number.isFinite(share.percent) || share.percent < 0) return false;
    if (share.percent > 0 && !isSilkFibre(share.fibre)) return false;
    total += share.percent;
  }
  return Math.abs(total - 100) < 1e-9;
}

export function giDisplayName(giEligible: boolean): string {
  return giEligible ? GI_DISPLAY_NAME : NON_GI_ORIGIN_LABEL;
}

export function computeClaims(facts: ProductClaimFacts): ProductClaims {
  const silkMarkLabelNumber = normaliseLabelNumber(facts.silkMarkLabelNumber);
  const handloomMarkLabelNumber = normaliseLabelNumber(facts.handloomMarkLabelNumber);
  const pureSilk = silkMarkLabelNumber !== null && isPureSilkComposition(facts.composition);
  const originLabel = facts.wovenInBhagalpur === false ? null : giDisplayName(facts.giEligible);

  const badges: ClaimBadge[] = [];
  if (pureSilk) badges.push("pure_silk");
  if (silkMarkLabelNumber) badges.push("silk_mark");
  if (handloomMarkLabelNumber) badges.push("handloom");
  if (originLabel) badges.push(facts.giEligible ? "gi_bhagalpur" : "woven_in_bhagalpur");

  return { badges, pureSilk, silkMarkLabelNumber, handloomMarkLabelNumber, originLabel };
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** "Tussar warp, ghicha weft"; "Matka warp and weft"; null when nothing is recorded. */
export function compositionLabel(warp: Fibre | null, weft: Fibre | null): string | null {
  if (warp && weft) {
    return warp === weft
      ? `${fibreLabel(warp)} warp and weft`
      : `${fibreLabel(warp)} warp, ${lowerFirst(fibreLabel(weft))} weft`;
  }
  if (warp) return `${fibreLabel(warp)} warp`;
  if (weft) return `${fibreLabel(weft)} weft`;
  return null;
}

/** "70% tussar, 30% cotton", largest share first; null for an empty composition. */
export function compositionPercentLabel(composition: readonly FibreShare[]): string | null {
  const parts = [...composition]
    .filter((share) => share.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .map((share) => `${share.percent}% ${lowerFirst(fibreLabel(share.fibre))}`);
  return parts.length ? parts.join(", ") : null;
}
