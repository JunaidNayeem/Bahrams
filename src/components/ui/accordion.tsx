"use client";

import { ChevronDownIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

/** Wrapped in an <h3> by default; pass `headingLevel` to fit the page outline. */
function AccordionTrigger({
  className,
  children,
  headingLevel = 3,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & { headingLevel?: 2 | 3 | 4 }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <AccordionPrimitive.Header className="flex" asChild>
      <Heading>
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className={cn(
            "flex min-h-12 flex-1 items-center justify-between gap-4 rounded-sm py-3 text-left text-base font-medium transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
            className,
          )}
          {...props}
        >
          {children}
          <ChevronDownIcon
            className="pointer-events-none size-4 shrink-0 text-muted-foreground transition-transform duration-200"
            aria-hidden
          />
        </AccordionPrimitive.Trigger>
      </Heading>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
