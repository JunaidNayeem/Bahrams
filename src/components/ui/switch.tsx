"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * For settings that apply immediately (admin toggles). Consent choices use a Checkbox so each
 * DPDP purpose is an explicit, separate opt-in that is submitted with the form.
 */
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border shadow-card transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=unchecked]:border-input data-[state=unchecked]:bg-charcoal-200",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-ivory-50 shadow-raised transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-px"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
