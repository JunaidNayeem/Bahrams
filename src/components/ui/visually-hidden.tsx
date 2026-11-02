import type * as React from "react";

import { cn } from "@/lib/utils";

/** Text for assistive technology only. Server-safe equivalent of Radix VisuallyHidden. */
function VisuallyHidden({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="visually-hidden" className={cn("sr-only", className)} {...props} />;
}

export { VisuallyHidden };
