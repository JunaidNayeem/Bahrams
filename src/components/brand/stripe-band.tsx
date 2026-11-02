import type * as React from "react";

import { cn } from "@/lib/utils";

import {
  checkGradient,
  STRIPE_COLORWAYS,
  stripeGradient,
  type StripeColorway,
} from "./stripe-pattern";

const heights = { xs: "h-1.5", sm: "h-3", md: "h-5", lg: "h-8" } as const;

type StripeBandProps = Omit<React.ComponentProps<"div">, "children" | "style"> & {
  pattern?: "stripe" | "check";
  colorway?: StripeColorway;
  size?: keyof typeof heights;
};

/**
 * Decorative band in a Bhagalpuri stripe or check, for borders and section edges. It takes no
 * children on purpose: the brief forbids stripe patterns behind text.
 */
function StripeBand({
  pattern = "stripe",
  colorway = "madder",
  size = "sm",
  className,
  ...props
}: StripeBandProps) {
  const stops = STRIPE_COLORWAYS[colorway];
  return (
    <div
      data-slot="stripe-band"
      aria-hidden
      className={cn("w-full shrink-0", heights[size], className)}
      style={{
        backgroundImage: pattern === "check" ? checkGradient(stops) : stripeGradient(stops),
      }}
      {...props}
    />
  );
}

export { StripeBand, type StripeBandProps };
