import type { Fibre } from "../enums";

/** Sentence-case display names, matching the kickoff glossary. */
export const FIBRE_LABELS: Readonly<Record<Fibre, string>> = {
  tussar: "Tussar",
  ghicha: "Ghicha",
  matka: "Matka",
  raw_silk: "Raw silk",
  mulberry: "Mulberry silk",
  eri: "Eri silk",
  noil: "Silk noil",
  cotton_silk: "Cotton-silk",
  linen: "Linen",
  cotton: "Cotton",
  blend: "Blend",
};

/** Fibres that are 100% silk. Cotton-silk and "blend" are not, however silky they feel. */
export const SILK_FIBRES: readonly Fibre[] = [
  "tussar",
  "ghicha",
  "matka",
  "raw_silk",
  "mulberry",
  "eri",
  "noil",
];

export function isSilkFibre(fibre: Fibre): boolean {
  return SILK_FIBRES.includes(fibre);
}

export function fibreLabel(fibre: Fibre): string {
  return FIBRE_LABELS[fibre];
}
