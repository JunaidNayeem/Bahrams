import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/*
 * Live-text version of the logo's wordmark (the outlined master is public/brand/logo-*.svg), so
 * the name stays selectable and crisp at any size. Pair it with <BrandMark> for the full logo.
 */

const wordmarkVariants = cva("inline-flex leading-none select-none", {
  variants: {
    layout: {
      stacked: "flex-col items-center gap-[0.18em]",
      inline: "flex-row items-baseline gap-[0.3em]",
    },
    size: {
      sm: "text-2xl",
      default: "text-3xl",
      lg: "text-5xl",
      xl: "text-6xl sm:text-7xl",
    },
    tone: {
      default: "text-foreground [--wordmark-accent:var(--gold-text)]",
      primary: "text-primary [--wordmark-accent:var(--gold-text)]",
      inverse: "text-ivory-50 [--wordmark-accent:var(--color-gold-200)]",
    },
  },
  defaultVariants: { layout: "stacked", size: "default", tone: "default" },
});

type WordmarkProps = Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof wordmarkVariants>;

/**
 * "Bahram Silks" set in the display serif. Screen readers get the plain name once; the styled
 * halves are hidden from them so the stacked layout is not read as "BahramSilks".
 */
function Wordmark({ layout, size, tone, className, ...props }: WordmarkProps) {
  const isInline = layout === "inline";
  return (
    <span
      data-slot="wordmark"
      className={cn(wordmarkVariants({ layout, size, tone }), className)}
      {...props}
    >
      <span className="sr-only">{siteConfig.name}</span>
      <span aria-hidden className="font-display font-bold tracking-[0.01em]">
        Bahram
      </span>
      <span
        aria-hidden
        className={cn(
          "font-display font-medium text-(--wordmark-accent) uppercase",
          isInline
            ? "text-[0.62em] tracking-[0.22em]"
            : "pl-[0.5em] text-[0.34em] tracking-[0.5em]",
        )}
      >
        Silks
      </span>
    </span>
  );
}

export { Wordmark, wordmarkVariants, type WordmarkProps };
