import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { cn } from "@/lib/utils";

/** Pair with a BreadcrumbList JSON-LD block (src/lib/seo) carrying the same items. */
function Breadcrumb(props: React.ComponentProps<"nav">) {
  return <nav aria-label="Breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      data-slot="breadcrumb-link"
      className={cn(
        "rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn("font-medium text-foreground", className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  );
}

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      className={cn("flex size-6 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" aria-hidden />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
