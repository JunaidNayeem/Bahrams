/**
 * Mirror of the colour tokens in src/app/globals.css, used to render the styleguide swatches
 * and to unit-test contrast. tokens.test.ts fails if this file and globals.css drift apart,
 * so edit both together.
 */

export const PALETTE = {
  gold: {
    50: "#fbf7ec",
    100: "#f5ebcf",
    200: "#ebd6a0",
    300: "#dfbe6e",
    400: "#d2a646",
    500: "#c08f2e",
    600: "#a37424",
    700: "#835a1f",
    800: "#6c4a1f",
    900: "#5b3e1e",
    950: "#34210e",
  },
  madder: {
    50: "#fdf3f2",
    100: "#fbe4e1",
    200: "#f6cbc6",
    300: "#eea49c",
    400: "#e27166",
    500: "#d0473b",
    600: "#b4302a",
    700: "#8e2420",
    800: "#75201d",
    900: "#611e1c",
    950: "#360c0b",
  },
  ivory: {
    50: "#fffdf8",
    100: "#fbf7ee",
    200: "#f4edde",
    300: "#eadfc8",
  },
  indigo: {
    50: "#eff1f8",
    100: "#dde2f1",
    200: "#bcc5e3",
    300: "#93a1cf",
    400: "#6b7cb8",
    500: "#4e5f9e",
    600: "#3d4c85",
    700: "#323e6c",
    800: "#2a3358",
    900: "#232a47",
    950: "#15192c",
  },
  leaf: {
    50: "#f1f7ee",
    100: "#deedd6",
    200: "#bedbaf",
    300: "#95c27e",
    400: "#6fa556",
    500: "#4f8a3a",
    600: "#3e6f2e",
    700: "#335a27",
    800: "#2b4822",
    900: "#243c1e",
    950: "#11210d",
  },
  charcoal: {
    50: "#f7f5f2",
    100: "#ede9e4",
    200: "#dad4cc",
    300: "#b9b0a5",
    400: "#8a8176",
    500: "#6f675e",
    600: "#5a534c",
    700: "#47413b",
    800: "#38332e",
    900: "#26221f",
    950: "#171412",
  },
} as const;

export type PaletteName = keyof typeof PALETTE;
/** A palette reference such as "gold-700", matching the `--color-gold-700` CSS variable. */
export type PaletteRef = {
  [P in PaletteName]: `${P}-${keyof (typeof PALETTE)[P] & number}`;
}[PaletteName];

export const PALETTE_DESCRIPTIONS: Record<PaletteName, string> = {
  gold: "Tussar gold: the natural colour of tussar silk. 500 and lighter are decorative only; use 700+ (gold-text) for text.",
  madder: "Deep madder red: the primary action colour, drawn from Bhagalpuri dyeing.",
  ivory: "Ivory and cream: page and card backgrounds.",
  indigo: "Indigo: information and links in dense admin views.",
  leaf: "Leaf green: success and in-stock states.",
  charcoal: "Charcoal: body text, muted text and form borders.",
};

/** Semantic (shadcn-compatible) tokens defined on :root, mapped to palette steps. */
export const SEMANTIC = {
  background: "ivory-100",
  foreground: "charcoal-900",
  card: "ivory-50",
  "card-foreground": "charcoal-900",
  popover: "ivory-50",
  "popover-foreground": "charcoal-900",
  primary: "madder-700",
  "primary-foreground": "ivory-50",
  secondary: "ivory-200",
  "secondary-foreground": "charcoal-900",
  muted: "ivory-200",
  "muted-foreground": "charcoal-600",
  accent: "gold-100",
  "accent-foreground": "charcoal-900",
  destructive: "madder-600",
  "destructive-foreground": "ivory-50",
  success: "leaf-700",
  "success-foreground": "ivory-50",
  warning: "gold-700",
  "warning-foreground": "ivory-50",
  info: "indigo-600",
  "info-foreground": "ivory-50",
  "gold-text": "gold-700",
  zari: "gold-500",
  border: "ivory-300",
  input: "charcoal-400",
  ring: "gold-700",
  "chart-1": "madder-700",
  "chart-2": "gold-600",
  "chart-3": "indigo-500",
  "chart-4": "leaf-500",
  "chart-5": "charcoal-500",
  sidebar: "ivory-200",
  "sidebar-foreground": "charcoal-900",
  "sidebar-primary": "madder-700",
  "sidebar-primary-foreground": "ivory-50",
  "sidebar-accent": "gold-100",
  "sidebar-accent-foreground": "charcoal-900",
  "sidebar-border": "ivory-300",
  "sidebar-ring": "gold-700",
} as const satisfies Record<string, PaletteRef>;

export type SemanticToken = keyof typeof SEMANTIC;

/** WCAG 2.2 minimums: 4.5:1 for body text, 3:1 for UI component boundaries and graphics. */
export type ContrastKind = "text" | "ui";
export const CONTRAST_MINIMUM: Record<ContrastKind, number> = { text: 4.5, ui: 3 };

export type ContrastPair = {
  fg: SemanticToken | PaletteRef;
  bg: SemanticToken | PaletteRef;
  kind: ContrastKind;
  use: string;
};

/** Every foreground/background combination the design system uses. All are unit-tested. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { fg: "foreground", bg: "background", kind: "text", use: "Body text" },
  { fg: "card-foreground", bg: "card", kind: "text", use: "Text on cards" },
  { fg: "popover-foreground", bg: "popover", kind: "text", use: "Menus, popovers" },
  { fg: "primary-foreground", bg: "primary", kind: "text", use: "Primary button" },
  { fg: "secondary-foreground", bg: "secondary", kind: "text", use: "Secondary button" },
  { fg: "muted-foreground", bg: "background", kind: "text", use: "Help text" },
  { fg: "muted-foreground", bg: "card", kind: "text", use: "Help text on cards" },
  { fg: "muted-foreground", bg: "muted", kind: "text", use: "Text in muted panels" },
  { fg: "accent-foreground", bg: "accent", kind: "text", use: "Hovered menu item" },
  { fg: "destructive-foreground", bg: "destructive", kind: "text", use: "Destructive button" },
  { fg: "success-foreground", bg: "success", kind: "text", use: "Success toast/badge" },
  { fg: "warning-foreground", bg: "warning", kind: "text", use: "Warning badge" },
  { fg: "info-foreground", bg: "info", kind: "text", use: "Info badge" },
  { fg: "gold-text", bg: "background", kind: "text", use: "Gold text (eyebrows, accents)" },
  { fg: "gold-text", bg: "card", kind: "text", use: "Gold text on cards" },
  { fg: "gold-text", bg: "muted", kind: "text", use: "Gold text on cream" },
  { fg: "gold-text", bg: "accent", kind: "text", use: "Gold text on gold tint" },
  { fg: "primary", bg: "background", kind: "text", use: "Links, prices" },
  { fg: "primary", bg: "card", kind: "text", use: "Links on cards" },
  { fg: "primary", bg: "muted", kind: "text", use: "Links on cream" },
  { fg: "destructive", bg: "background", kind: "text", use: "Form error messages" },
  { fg: "destructive", bg: "card", kind: "text", use: "Form errors on cards" },
  { fg: "success", bg: "background", kind: "text", use: "In-stock text" },
  { fg: "info", bg: "background", kind: "text", use: "Info text" },
  { fg: "foreground", bg: "muted", kind: "text", use: "Text on cream" },
  { fg: "madder-800", bg: "madder-50", kind: "text", use: "Soft red badge" },
  { fg: "gold-800", bg: "gold-100", kind: "text", use: "Soft gold badge" },
  { fg: "gold-800", bg: "gold-50", kind: "text", use: "Claim badge" },
  { fg: "muted-foreground", bg: "gold-50", kind: "text", use: "Hovered table row" },
  { fg: "leaf-800", bg: "leaf-50", kind: "text", use: "Soft green badge" },
  { fg: "indigo-800", bg: "indigo-50", kind: "text", use: "Soft indigo badge" },
  { fg: "charcoal-800", bg: "charcoal-100", kind: "text", use: "Soft neutral badge" },
  { fg: "ivory-50", bg: "charcoal-900", kind: "text", use: "Inverse (tooltip, footer)" },
  { fg: "gold-200", bg: "charcoal-900", kind: "text", use: "Gold on inverse" },
  { fg: "input", bg: "background", kind: "ui", use: "Form control border" },
  { fg: "input", bg: "card", kind: "ui", use: "Form control border on cards" },
  { fg: "input", bg: "muted", kind: "ui", use: "Form control border on cream" },
  { fg: "ring", bg: "background", kind: "ui", use: "Focus ring" },
  { fg: "ring", bg: "card", kind: "ui", use: "Focus ring on cards" },
  { fg: "gold-600", bg: "background", kind: "ui", use: "Rating stars" },
  { fg: "gold-600", bg: "card", kind: "ui", use: "Rating stars on cards" },
];

export function resolveToken(token: SemanticToken | PaletteRef): string {
  const ref: PaletteRef =
    token in SEMANTIC ? SEMANTIC[token as SemanticToken] : (token as PaletteRef);
  const [name, step] = ref.split("-") as [PaletteName, string];
  const scale: Record<string, string> = PALETTE[name];
  const hex = scale[step];
  if (!hex) throw new Error(`Unknown palette reference: ${ref}`);
  return hex;
}
