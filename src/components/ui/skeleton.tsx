import type * as React from "react";

import { cn } from "@/lib/utils";

/** Loading placeholder. Decorative: pair the loading region with aria-busy or a status message. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-ivory-300/70", className)}
      {...props}
    />
  );
}

export { Skeleton };
