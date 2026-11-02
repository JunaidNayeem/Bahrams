import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { cn } from "@/lib/utils";

import { buttonVariants, type ButtonProps } from "./button";
import { paginationRange } from "./pagination-range";

/**
 * Real links (not buttons) so crawlers can follow paginated collection pages. Page 1 should be
 * the bare collection URL; the caller's `hrefForPage` decides that.
 */
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row flex-wrap items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = React.ComponentProps<typeof Link> & {
  isActive?: boolean;
  size?: ButtonProps["size"];
};

function PaginationLink({ className, isActive, size = "icon", ...props }: PaginationLinkProps) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({ variant: isActive ? "outline" : "ghost", size }),
        isActive && "border-primary text-primary",
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon aria-hidden />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon aria-hidden />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-10 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
    </span>
  );
}

type PaginationNavProps = Omit<React.ComponentProps<"nav">, "children"> & {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
};

/** Complete pager: previous, numbered pages with ellipses, next. Renders nothing for one page. */
function PaginationNav({ currentPage, totalPages, hrefForPage, ...props }: PaginationNavProps) {
  if (totalPages <= 1) return null;
  const entries = paginationRange(currentPage, totalPages);
  return (
    <Pagination {...props}>
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious href={hrefForPage(currentPage - 1)} />
          </PaginationItem>
        )}
        {entries.map((entry) =>
          typeof entry === "number" ? (
            <PaginationItem key={entry}>
              <PaginationLink
                href={hrefForPage(entry)}
                isActive={entry === currentPage}
                aria-label={`Page ${entry}`}
              >
                {entry}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={entry}>
              <PaginationEllipsis />
            </PaginationItem>
          ),
        )}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext href={hrefForPage(currentPage + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNav,
  PaginationNext,
  PaginationPrevious,
};
