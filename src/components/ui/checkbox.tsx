"use client";

import { CheckIcon, MinusIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The visible box is 20px; a transparent ::after extends the hit area to 24x24 (WCAG 2.5.8).
 * Pair with <Label htmlFor> so the label text is clickable too.
 */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer group/checkbox relative size-5 shrink-0 rounded-sm border border-input bg-card shadow-card transition-[color,box-shadow,border-color] outline-none after:absolute after:-inset-0.5 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon
          className="size-3.5 group-data-[state=indeterminate]/checkbox:hidden"
          aria-hidden
        />
        <MinusIcon
          className="hidden size-3.5 group-data-[state=indeterminate]/checkbox:block"
          aria-hidden
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
