import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Status and category labels. Soft variants (tinted background, dark text) are for dense lists
 * such as admin order tables; solid variants are for emphasis. Every pairing passes 4.5:1.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-input text-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        info: "border-transparent bg-info text-info-foreground",
        gold: "border-gold-300 bg-gold-100 text-gold-800",
        "soft-red": "border-madder-200 bg-madder-50 text-madder-800",
        "soft-green": "border-leaf-200 bg-leaf-50 text-leaf-800",
        "soft-indigo": "border-indigo-200 bg-indigo-50 text-indigo-800",
        "soft-neutral": "border-charcoal-200 bg-charcoal-100 text-charcoal-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean };

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants, type BadgeProps };
