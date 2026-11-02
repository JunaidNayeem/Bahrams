import type * as React from "react";

import { cn } from "@/lib/utils";

import { ZariDivider } from "./zari-divider";

type SectionHeadingProps = Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  /** Small gold capitals above the title, e.g. "The craft". */
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  /** Heading level; pick the one that fits the page outline (one h1 per page). */
  as?: "h1" | "h2" | "h3";
  align?: "start" | "center";
  /** Zari rule under the heading block. */
  divider?: boolean;
  /** Trailing link such as "View all"; shown beside the title on wide screens. */
  action?: React.ReactNode;
  /** id for the heading, so a <section aria-labelledby> can point at it. */
  headingId?: string;
};

const titleSizes = {
  h1: "text-display-xl",
  h2: "text-display-lg",
  h3: "text-display-md",
} as const;

function SectionHeading({
  title,
  eyebrow,
  description,
  as: Heading = "h2",
  align = "start",
  divider = false,
  action,
  headingId,
  className,
  ...props
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      data-slot="section-heading"
      className={cn("flex flex-col gap-3", centered && "items-center text-center", className)}
      {...props}
    >
      <div
        className={cn(
          "flex w-full flex-col gap-2",
          action && !centered && "sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        )}
      >
        <div className={cn("flex flex-col gap-2", centered && "items-center")}>
          {eyebrow && <p className="text-eyebrow text-gold-text uppercase">{eyebrow}</p>}
          <Heading
            id={headingId}
            className={cn(
              "font-display font-semibold text-balance text-foreground",
              titleSizes[Heading],
            )}
          >
            {title}
          </Heading>
        </div>
        {action && <div className="shrink-0 text-sm font-medium">{action}</div>}
      </div>
      {description && (
        <p className={cn("max-w-prose text-pretty text-muted-foreground", centered && "mx-auto")}>
          {description}
        </p>
      )}
      {divider && <ZariDivider className={cn("mt-1", centered ? "w-40" : "w-32")} />}
    </div>
  );
}

export { SectionHeading, type SectionHeadingProps };
