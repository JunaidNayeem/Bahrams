import type * as React from "react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type MonogramProps = Omit<React.ComponentProps<"svg">, "children"> & {
  /** Rendered width and height in px. */
  size?: number;
  /** Hide from assistive technology when the brand name is already written next to it. */
  decorative?: boolean;
};

/**
 * PLACEHOLDER monogram (a serif "B" inside a double-ruled square, like a zari border) until the
 * commissioned logo suite arrives. Square on purpose: round seals and cocoon outlines are kept
 * clear of the Silk Mark, Handloom Mark and India Handloom Brand logos.
 */
function Monogram({ size = 40, decorative = false, className, ...props }: MonogramProps) {
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img", "aria-label": siteConfig.name };
  return (
    <svg
      data-slot="monogram"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={cn("text-primary", className)}
      {...a11y}
      {...props}
    >
      <rect x="1" y="1" width="38" height="38" rx="3" fill="none" stroke="currentColor" />
      <rect
        x="4"
        y="4"
        width="32"
        height="32"
        rx="1.5"
        fill="none"
        stroke="var(--color-zari)"
        strokeWidth="0.75"
      />
      <text
        x="20"
        y="28.5"
        textAnchor="middle"
        fill="currentColor"
        fontSize="24"
        fontWeight="600"
        style={{ fontFamily: "var(--font-display)" }}
      >
        B
      </text>
    </svg>
  );
}

export { Monogram, type MonogramProps };
