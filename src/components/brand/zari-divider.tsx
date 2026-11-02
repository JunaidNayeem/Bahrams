import type * as React from "react";

import { cn } from "@/lib/utils";

type ZariDividerProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Small lozenge at the centre, like the butta on a saree border. */
  ornament?: boolean;
  tone?: "zari" | "madder";
  /** Expose as a separator to assistive technology; by default it is decoration only. */
  decorative?: boolean;
};

/** Thin double-ruled "zari" line used between page sections. */
function ZariDivider({
  ornament = true,
  tone = "zari",
  decorative = true,
  className,
  ...props
}: ZariDividerProps) {
  const rule = "h-[3px] flex-1 border-y border-current";
  return (
    <div
      data-slot="zari-divider"
      {...(decorative ? { "aria-hidden": true } : { role: "separator" })}
      className={cn(
        "flex w-full items-center gap-2",
        tone === "zari" ? "text-zari" : "text-primary",
        className,
      )}
      {...props}
    >
      <span className={rule} />
      {ornament && (
        <svg viewBox="0 0 12 12" className="size-2.5 shrink-0" aria-hidden>
          <path d="M6 0 12 6 6 12 0 6Z" fill="currentColor" />
          <path d="M6 3 9 6 6 9 3 6Z" fill="var(--background)" />
        </svg>
      )}
      <span className={rule} />
    </div>
  );
}

export { ZariDivider, type ZariDividerProps };
