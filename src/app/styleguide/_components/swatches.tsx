import { contrastRatio, formatRatio } from "../contrast";
import {
  CONTRAST_MINIMUM,
  CONTRAST_PAIRS,
  PALETTE,
  PALETTE_DESCRIPTIONS,
  SEMANTIC,
  resolveToken,
  type PaletteName,
  type SemanticToken,
} from "../tokens";

const BACKGROUND = resolveToken("background");
const FOREGROUND = resolveToken("foreground");
const LIGHT_TEXT = resolveToken("ivory-50");

/** Pick whichever of the dark or light text colour reads better on a swatch. */
function labelColor(hex: string): string {
  return contrastRatio(hex, FOREGROUND) >= contrastRatio(hex, LIGHT_TEXT) ? FOREGROUND : LIGHT_TEXT;
}

function textVerdict(ratio: number): string {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "UI / large";
  return "decorative";
}

export function PaletteSwatches() {
  return (
    <div className="grid gap-8">
      {(Object.keys(PALETTE) as PaletteName[]).map((name) => {
        const scale: Record<string, string> = PALETTE[name];
        return (
          <div key={name} className="grid gap-3">
            <div>
              <h3 className="font-semibold capitalize">{name}</h3>
              <p className="text-sm text-muted-foreground">{PALETTE_DESCRIPTIONS[name]}</p>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11">
              {Object.entries(scale).map(([step, hex]) => {
                const onBackground = contrastRatio(hex, BACKGROUND);
                return (
                  <li key={step} className="overflow-hidden rounded-md border bg-card text-xs">
                    <div
                      className="flex h-16 items-end p-2 font-medium"
                      style={{ backgroundColor: hex, color: labelColor(hex) }}
                    >
                      {name}-{step}
                    </div>
                    <dl className="grid gap-0.5 p-2 tabular-nums">
                      <div className="flex justify-between gap-2">
                        <dt className="sr-only">Hex</dt>
                        <dd className="font-mono">{hex}</dd>
                      </div>
                      <div className="flex justify-between gap-2 text-muted-foreground">
                        <dt>on bg</dt>
                        <dd>
                          {formatRatio(onBackground)} · {textVerdict(onBackground)}
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function SemanticSwatches() {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.keys(SEMANTIC) as SemanticToken[]).map((token) => (
        <li key={token} className="flex items-center gap-3 rounded-md border bg-card p-2 text-sm">
          <span
            className="size-10 shrink-0 rounded border"
            style={{ backgroundColor: `var(--${token})` }}
            aria-hidden
          />
          <span className="grid">
            <code className="font-mono text-xs">--{token}</code>
            <span className="text-xs text-muted-foreground">
              {SEMANTIC[token]} · {resolveToken(token)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ContrastTable() {
  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Contrast ratio of every colour pairing in the system</caption>
        <thead className="bg-muted/60 text-left text-xs text-muted-foreground uppercase">
          <tr>
            <th className="px-3 py-2 font-semibold">Sample</th>
            <th className="px-3 py-2 font-semibold">Pairing</th>
            <th className="px-3 py-2 font-semibold">Used for</th>
            <th className="px-3 py-2 text-right font-semibold">Ratio</th>
            <th className="px-3 py-2 text-right font-semibold">Needs</th>
          </tr>
        </thead>
        <tbody>
          {CONTRAST_PAIRS.map((pair) => {
            const fg = resolveToken(pair.fg);
            const bg = resolveToken(pair.bg);
            const ratio = contrastRatio(fg, bg);
            const minimum = CONTRAST_MINIMUM[pair.kind];
            const passes = ratio >= minimum;
            return (
              <tr key={`${pair.fg}/${pair.bg}`} className="border-t">
                <td className="px-3 py-2">
                  <span
                    className="inline-flex h-8 min-w-16 items-center justify-center rounded border px-2 font-medium"
                    style={{
                      color: fg,
                      backgroundColor: bg,
                      borderColor: pair.kind === "ui" ? fg : undefined,
                    }}
                  >
                    Aa
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                  {pair.fg} on {pair.bg}
                </td>
                <td className="px-3 py-2">{pair.use}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatRatio(ratio)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">
                  {minimum}:1 {passes ? "✓" : "✗ fails"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
