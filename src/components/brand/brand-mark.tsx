import { useId } from "react";
import type * as React from "react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/*
 * The Bahram Silks mark, "Peepal on the Ganga": a peepal leaf (Bihar's state tree and a Bhagalpuri
 * textile motif) whose upper half carries veins drawn as zari threads and whose lower half is a
 * woven panel, warp threads crossed by weft that ripples like the Ganga at Bhagalpur.
 * A pointed leaf, not a round seal or an oval: it stays clear of the Silk Mark cocoon, the
 * Handloom Mark and the India Handloom Brand logo. Master files: public/brand/ (docs/brand/logo.md).
 */

/** Leaf outline in the mark's 100 x 120 drawing box; tip at the top, stalk below. */
export const LEAF_PATH =
  "M50 1C50.7 11 52.6 18.6 57.6 25.2C65.4 35.4 90.8 50.6 90.6 71.4C90.4 90.4 73.2 104 56 103.2" +
  "C53.4 103 51.4 101.8 50 100C48.6 101.8 46.6 103 44 103.2C26.8 104 9.6 90.4 9.4 71.4" +
  "C9.2 50.6 34.6 35.4 42.4 25.2C47.4 18.6 49.3 11 50 1Z";
const STALK_PATH = "M50 100.5C50.4 106.5 49.2 111.5 45.6 116.4";
const INSET = "translate(50 68) scale(0.88) translate(-50 -68)";

/** A weft line rippling across the leaf like the river. */
export function ripplePath(y: number, amp: number, step: number, from = 4, to = 96): string {
  let d = `M${from} ${y}`;
  for (let x = from; x < to; x += step) d += `q${step / 4} ${-amp} ${step / 2} 0t${step / 2} 0`;
  return d;
}

export const FULL_RIPPLES = [67, 79, 91];
const SIMPLE_RIPPLES = [68, 85];
const WARP = Array.from({ length: 11 }, (_, i) => 15 + i * 7).filter((x) => x !== 50);
const VEINS = [
  [55, 79, 45],
  [44, 69, 33.5],
  [33.5, 59.5, 25.5],
].flatMap(([y0, x1, y1]) =>
  [x1, 100 - x1].map((x) => `M50 ${y0}Q${50 + (x - 50) * 0.45} ${y0 - 2.5} ${x} ${y1}`),
);

const TONES = {
  color: {
    leaf: "var(--color-madder-700)",
    line: "var(--color-gold-300)",
    warp: "var(--color-ivory-100)",
  },
  reversed: {
    leaf: "var(--color-gold-300)",
    line: "var(--color-madder-800)",
    warp: "var(--color-madder-800)",
  },
} as const;

type BrandMarkProps = Omit<React.ComponentProps<"svg">, "children"> & {
  /** Rendered height in px; width follows the leaf's 5:6 proportion. */
  size?: number;
  /** color: madder and zari on light grounds. reversed: zari leaf on madder or charcoal. mono: currentColor. */
  tone?: keyof typeof TONES | "mono";
  /** full below ~40px turns to mush, so small sizes default to the simplified favicon drawing. */
  detail?: "full" | "simple";
  /** Hide from assistive technology when the brand name is already written next to it. */
  decorative?: boolean;
};

function BrandMark({
  size = 48,
  tone = "color",
  detail = size < 40 ? "simple" : "full",
  decorative = false,
  className,
  ...props
}: BrandMarkProps) {
  const id = useId();
  const full = detail === "full";
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img", "aria-label": siteConfig.name };

  // Mono knocks every line out of a solid leaf, so it prints in one ink (stamps, foil, embroidery).
  const c = tone === "mono" ? { leaf: "#fff", line: "#000", warp: null } : { ...TONES[tone] };
  const drawing = (
    <>
      {full && (
        <path d={STALK_PATH} fill="none" stroke={c.leaf} strokeWidth={3} strokeLinecap="round" />
      )}
      <path d={LEAF_PATH} fill={c.leaf} />
      {full && (
        <path d={LEAF_PATH} transform={INSET} fill="none" stroke={c.line} strokeWidth={1.15} />
      )}
      <g clipPath={`url(#${id}-clip)`} fill="none" stroke={c.line} strokeLinecap="round">
        {full &&
          c.warp &&
          WARP.map((x) => (
            <line
              key={x}
              x1={x}
              y1={60}
              x2={x}
              y2={110}
              stroke={c.warp}
              strokeOpacity={0.24}
              strokeWidth={0.9}
            />
          ))}
        <line
          x1={50}
          y1={full ? 10 : 22}
          x2={50}
          y2={full ? 104 : 56}
          strokeWidth={full ? 2.2 : 6.5}
        />
        {full && VEINS.map((d) => <path key={d} d={d} strokeWidth={1.5} />)}
        {(full ? FULL_RIPPLES : SIMPLE_RIPPLES).map((y) => (
          <path
            key={y}
            d={full ? ripplePath(y, 2.6, 9) : ripplePath(y, 4.2, 16)}
            strokeWidth={full ? 2.3 : 6}
          />
        ))}
      </g>
    </>
  );

  return (
    <svg
      data-slot="brand-mark"
      viewBox="0 0 100 120"
      width={(size * 5) / 6}
      height={size}
      className={cn("shrink-0", tone === "mono" && "text-foreground", className)}
      {...a11y}
      {...props}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={LEAF_PATH} transform={INSET} />
        </clipPath>
        {tone === "mono" && (
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={0} y={0} width={100} height={120}>
            <rect width={100} height={120} fill="#000" />
            {drawing}
          </mask>
        )}
      </defs>
      {tone === "mono" ? (
        <rect width={100} height={120} fill="currentColor" mask={`url(#${id}-mask)`} />
      ) : (
        drawing
      )}
    </svg>
  );
}

export { BrandMark, type BrandMarkProps };
