import type * as React from "react";

import { cn } from "@/lib/utils";

/** A titled block on the styleguide page. */
export function Specimen({
  title,
  note,
  children,
  className,
}: {
  title: string;
  note?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      <div className={cn("rounded-lg border bg-card p-4 sm:p-6", className)}>{children}</div>
    </div>
  );
}

/** A top-level styleguide section with an anchor for the table of contents. */
export function StyleguideSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="grid scroll-mt-6 gap-6">
      <h2 id={id} className="font-display text-display-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}
