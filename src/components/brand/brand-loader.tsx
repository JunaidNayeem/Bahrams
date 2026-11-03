import { cn } from "@/lib/utils";

import { FULL_RIPPLES, LEAF_PATH, ripplePath } from "./brand-mark";

type BrandLoaderProps = {
  /** Announced to screen readers; the animation itself is decorative. */
  label?: string;
  /** Rendered height of the leaf in px. */
  size?: number;
  className?: string;
};

/**
 * Loading state built from the brand mark: the leaf outline holds still while the three weft
 * threads are woven across it in turn, like a shuttle passing through the warp. With reduced
 * motion the global rule in globals.css stops the animation on its last frame (fully woven).
 */
function BrandLoader({ label = "Loading", size = 72, className }: BrandLoaderProps) {
  return (
    <div
      role="status"
      data-slot="brand-loader"
      className={cn("flex flex-col items-center justify-center gap-4 py-16", className)}
    >
      <svg
        viewBox="0 0 100 120"
        width={(size * 5) / 6}
        height={size}
        aria-hidden
        className="brand-loader"
      >
        <path d={LEAF_PATH} className="fill-madder-700/8 stroke-madder-700" strokeWidth={2.4} />
        <line x1={50} y1={10} x2={50} y2={100} className="stroke-madder-700/50" strokeWidth={1.6} />
        {FULL_RIPPLES.map((y, i) => (
          <path
            key={y}
            d={ripplePath(y, 2.6, 9, 14, 86)}
            pathLength={100}
            className="brand-loader__weft fill-none stroke-gold-500"
            style={{ animationDelay: `${i * 0.28}s` }}
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <span className="text-eyebrow text-muted-foreground uppercase">{label}…</span>
    </div>
  );
}

export { BrandLoader, type BrandLoaderProps };
