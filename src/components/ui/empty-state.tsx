import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = Omit<React.ComponentProps<"div">, "title"> & {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Usually one <Button asChild><Link/></Button> pointing somewhere useful. */
  action?: React.ReactNode;
  headingLevel?: 2 | 3;
};

/** Empty cart, no search results, no orders yet: say what happened and offer one next step. */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  headingLevel = 2,
  className,
  ...props
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {Icon && (
        <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-accent text-gold-text">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <Heading className="font-display text-display-sm font-semibold text-foreground">
        {title}
      </Heading>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { EmptyState, type EmptyStateProps };
