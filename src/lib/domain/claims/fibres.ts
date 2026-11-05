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
  silk: "Silk",
  desi_tussar: "Desi tussar",
  handspun_tussar: "Handspun tussar",
  // Bhagalpur trade name for spun China tussar yarn (also spelt "moonga"); not Assam's muga.
  munga: "Munga",
  katia: "Katia",
  dupion: "Dupion silk",
  spun_silk: "Spun silk",
  // Yarn thrown (twisted) from silk waste; "throster" is an old spelling.
  throwster: "Throwster silk",
  silk_blend: "Silk blend",
  modal_silk: "Modal silk",
  // Kota doria: a cotton-and-silk weave.
  kota: "Kota",
  organic_linen: "Organic linen",
  mercerised_cotton: "Mercerised cotton",
  khadi: "Khadi",
  viscose: "Viscose",
  handspun_viscose: "Handspun viscose",
  modal: "Modal",
  polyester: "Polyester",
  // Spun (staple-fibre) yarn, sold as "staple" or "katan staple"; usually art silk.
  staple: "Staple",
  // Trade name the client uses; fibre content unverified, so never counted as silk.
  rollex: "Rollex",
  zari: "Zari",
  handspun_yarn: "Handspun yarn",
  slub: "Slub yarn",
};

export type FibreGroupKey = "silk" | "blend" | "plant" | "man_made" | "metallic" | "yarn_type";

export interface FibreGroup {
  key: FibreGroupKey;
  label: string;
  fibres: readonly Fibre[];
}

/**
 * Fibre classification, in the order the admin shows it. Every fibre sits in exactly one group.
 * Only the "silk" group is 100% silk: anything that is a blend, imitates silk (modal silk, art
 * silk), or does not state its fibre (yarn types, unverified trade names) stays out of it, so it
 * can never earn a "Pure Silk" badge.
 */
export const FIBRE_GROUPS: readonly FibreGroup[] = [
  {
    key: "silk",
    label: "Silk",
    fibres: [
      "tussar",
      "desi_tussar",
      "handspun_tussar",
      "ghicha",
      "katia",
      "munga",
      "matka",
      "raw_silk",
      "mulberry",
      "silk",
      "dupion",
      "spun_silk",
      "throwster",
      "eri",
      "noil",
    ],
  },
  {
    key: "blend",
    label: "Silk blends",
    fibres: ["cotton_silk", "silk_blend", "modal_silk", "kota", "blend"],
  },
  {
    key: "plant",
    label: "Cotton and linen",
    fibres: ["linen", "organic_linen", "cotton", "mercerised_cotton", "khadi"],
  },
  {
    key: "man_made",
    label: "Man-made fibres",
    fibres: ["viscose", "handspun_viscose", "modal", "polyester", "staple", "rollex"],
  },
  { key: "metallic", label: "Metallic", fibres: ["zari"] },
  { key: "yarn_type", label: "Yarn types (fibre not stated)", fibres: ["handspun_yarn", "slub"] },
];

/** Fibres that are 100% silk. Cotton-silk, modal silk and blends are not, however silky they feel. */
export const SILK_FIBRES: readonly Fibre[] = FIBRE_GROUPS.find((g) => g.key === "silk")!.fibres;

export function isSilkFibre(fibre: Fibre): boolean {
  return SILK_FIBRES.includes(fibre);
}

export function fibreGroupOf(fibre: Fibre): FibreGroupKey {
  return FIBRE_GROUPS.find((g) => g.fibres.includes(fibre))!.key;
}

export function fibreLabel(fibre: Fibre): string {
  return FIBRE_LABELS[fibre];
}
