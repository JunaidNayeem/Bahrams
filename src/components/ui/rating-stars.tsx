import { StarIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

type RatingStarsProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Average rating, 0–5; rendered to the nearest tenth. */
  rating: number;
  /** Number of reviews, shown after the stars when provided. */
  count?: number;
  size?: "sm" | "default";
};

const MAX_RATING = 5;

/**
 * Read-only rating. The stars are one image with a text alternative ("Rated 4.5 out of 5"),
 * so partial stars never have to be read individually.
 */
function RatingStars({ rating, count, size = "default", className, ...props }: RatingStarsProps) {
  const clamped = Math.min(Math.max(rating, 0), MAX_RATING);
  const rounded = Math.round(clamped * 10) / 10;
  const fillPercent = (clamped / MAX_RATING) * 100;
  const starClass = size === "sm" ? "size-3.5" : "size-4";

  return (
    <span
      data-slot="rating-stars"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    >
      <span role="img" aria-label={`Rated ${rounded} out of ${MAX_RATING}`} className="relative">
        <span className="flex text-charcoal-300" aria-hidden>
          {Array.from({ length: MAX_RATING }, (_, i) => (
            <StarIcon key={i} className={cn(starClass, "fill-current")} strokeWidth={0} />
          ))}
        </span>
        <span
          className="absolute inset-0 flex overflow-hidden text-gold-600"
          style={{ width: `${fillPercent}%` }}
          aria-hidden
        >
          {Array.from({ length: MAX_RATING }, (_, i) => (
            <StarIcon key={i} className={cn(starClass, "shrink-0 fill-current")} strokeWidth={0} />
          ))}
        </span>
      </span>
      {count !== undefined && (
        <span className="text-sm text-muted-foreground tabular-nums">
          ({count}
          <span className="sr-only"> {count === 1 ? "review" : "reviews"}</span>)
        </span>
      )}
    </span>
  );
}

export { RatingStars, type RatingStarsProps };
