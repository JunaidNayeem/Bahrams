import { Specimen, StyleguideSection } from "./specimen";
import { ContrastTable, PaletteSwatches, SemanticSwatches } from "./swatches";

const DISPLAY_SIZES = [
  ["text-display-2xl", "Woven in Bhagalpur"],
  ["text-display-xl", "Tussar, raw and matka silk"],
  ["text-display-lg", "Shop by fabric"],
  ["text-display-md", "Fabric by the metre"],
  ["text-display-sm", "Care for your saree"],
] as const;

const BODY_SIZES = ["text-xl", "text-lg", "text-base", "text-sm", "text-xs"] as const;

const SHADOWS = ["shadow-card", "shadow-raised", "shadow-overlay"] as const;
const RADII = ["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-full"] as const;

export function ColourSection() {
  return (
    <StyleguideSection id="colour" title="Colour">
      <Specimen
        title="Brand palette"
        note="Ratios are against the page background (ivory-100). Gold 500 and lighter is decorative only."
        className="bg-background"
      >
        <PaletteSwatches />
      </Specimen>
      <Specimen title="Semantic tokens" note="Components use only these names, never raw hex.">
        <SemanticSwatches />
      </Specimen>
      <Specimen
        title="Contrast pairs"
        note="Every text/background pairing the system uses. Text needs 4.5:1; borders, focus rings and icons need 3:1. Unit-tested in tokens.test.ts."
        className="p-0 sm:p-0"
      >
        <ContrastTable />
      </Specimen>
    </StyleguideSection>
  );
}

export function TypographySection() {
  return (
    <StyleguideSection id="type" title="Typography">
      <Specimen
        title="Display: Cormorant Garamond"
        note="Fluid sizes; headings only, never body copy."
      >
        <div className="grid gap-4">
          {DISPLAY_SIZES.map(([size, sample]) => (
            <div key={size} className="grid gap-1">
              <code className="text-xs text-muted-foreground">{size}</code>
              <p className={`font-display font-semibold ${size}`}>{sample}</p>
            </div>
          ))}
          <div className="grid gap-1">
            <code className="text-xs text-muted-foreground">text-eyebrow</code>
            <p className="text-eyebrow text-gold-text uppercase">The craft</p>
          </div>
        </div>
      </Specimen>
      <Specimen title="Body and UI: Inter">
        <div className="grid gap-3">
          {BODY_SIZES.map((size) => (
            <p key={size} className={size}>
              <code className="mr-3 text-xs text-muted-foreground">{size}</code>
              Tussar is a wild silk with a natural gold-to-copper hue and a soft matte sheen.
            </p>
          ))}
          <p className="max-w-prose text-muted-foreground">
            Muted text is for help and metadata. Body copy stays at least 16px on phones, with a
            line length near 65 characters (max-w-prose).
          </p>
        </div>
      </Specimen>
      <Specimen
        title="Devanagari: Tiro Devanagari Hindi"
        note="Phase 2. Loads only when Hindi text renders."
      >
        <p lang="hi" className="text-2xl">
          भागलपुर का तसर रेशम, सीधे बुनकर से
        </p>
      </Specimen>
    </StyleguideSection>
  );
}

export function SurfaceSection() {
  return (
    <StyleguideSection id="surface" title="Radius, shadow, width">
      <Specimen title="Radii">
        <div className="flex flex-wrap gap-4">
          {RADII.map((radius) => (
            <div key={radius} className="grid justify-items-center gap-2 text-xs">
              <span className={`size-16 border-2 border-gold-500 bg-accent ${radius}`} />
              <code>{radius}</code>
            </div>
          ))}
        </div>
      </Specimen>
      <Specimen
        title="Shadows"
        note="Warm and low; tinted with gold-950 rather than black."
        className="bg-background"
      >
        <div className="flex flex-wrap gap-6">
          {SHADOWS.map((shadow) => (
            <div
              key={shadow}
              className={`grid size-28 place-items-center rounded-lg bg-card text-xs ${shadow}`}
            >
              <code>{shadow}</code>
            </div>
          ))}
        </div>
      </Specimen>
      <Specimen title="Containers">
        <ul className="grid gap-2 text-sm">
          <li>
            <code>max-w-prose</code> 42rem: long-form guides and journal articles
          </li>
          <li>
            <code>max-w-content</code> / <code>container-page</code> 80rem: standard page width,
            gutters 16 / 24 / 32px
          </li>
          <li>
            <code>max-w-wide</code> 96rem: full-bleed galleries and admin tables
          </li>
        </ul>
      </Specimen>
    </StyleguideSection>
  );
}
