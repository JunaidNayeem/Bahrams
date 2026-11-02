import { LoaderCircleIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

type SpinnerProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Announced to screen readers. Pass `null` when a surrounding element already says it. */
  label?: string | null;
};

function Spinner({ className, label = "Loading", ...props }: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      role={label ? "status" : undefined}
      className={cn("inline-flex items-center", className)}
      {...props}
    >
      <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export { Spinner, type SpinnerProps };
