import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

import { formatPaise, paiseToRupeeString } from "./price-format";

const priceVariants = cva("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums", {
  variants: {
    size: {
      sm: "text-sm",
      default: "text-base",
      lg: "text-xl",
      xl: "text-2xl",
    },
  },
  defaultVariants: { size: "default" },
});

type PriceUnit = "piece" | "metre";

type PriceProps = Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof priceVariants> & {
    /** Selling price in integer paise, GST-inclusive. */
    pricePaise: number;
    /**
     * Earlier price to show struck through. Pass it ONLY when src/lib/domain/pricing has
     * validated it against price_history; this component does no validation of its own.
     */
    priorPricePaise?: number;
    /** "metre" appends "/ m" for fabric sold by length. */
    unit?: PriceUnit;
  };

/**
 * Renders a price as "₹3,800" (Indian digit grouping). Screen readers hear "Price ₹3,800", or
 * "Price ₹3,800, prior price ₹4,500" when a validated prior price is passed.
 */
function Price({
  pricePaise,
  priorPricePaise,
  unit = "piece",
  size,
  className,
  ...props
}: PriceProps) {
  const perMetre = unit === "metre";
  const showPrior = priorPricePaise !== undefined && priorPricePaise > pricePaise;

  return (
    <span data-slot="price" className={cn(priceVariants({ size }), className)} {...props}>
      <span className="font-semibold text-foreground">
        <span className="sr-only">Price </span>
        <data value={paiseToRupeeString(pricePaise)}>{formatPaise(pricePaise)}</data>
        {perMetre && (
          <span className="text-[0.85em] font-normal text-muted-foreground">
            <span aria-hidden> / m</span>
            <span className="sr-only"> per metre</span>
          </span>
        )}
      </span>
      {showPrior && (
        <span className="text-[0.85em] text-muted-foreground">
          <span className="sr-only">, prior price </span>
          <s>
            <data value={paiseToRupeeString(priorPricePaise)}>{formatPaise(priorPricePaise)}</data>
          </s>
        </span>
      )}
    </span>
  );
}

export { Price, priceVariants, type PriceProps, type PriceUnit };
