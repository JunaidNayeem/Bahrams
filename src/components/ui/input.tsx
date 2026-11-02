import type * as React from "react";

import { cn } from "@/lib/utils";

const inputClassName =
  "flex h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-card transition-[color,box-shadow,border-color] outline-none selection:bg-gold-200 placeholder:text-muted-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input type={type} data-slot="input" className={cn(inputClassName, className)} {...props} />
  );
}

export { Input, inputClassName };
