import {
  BadgeCheckIcon,
  HandHeartIcon,
  MapPinIcon,
  SpoolIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { cn } from "@/lib/utils";

export type ProofKey = "silk_mark" | "gi_bhagalpur" | "handloom" | "direct_from_weaver";

export type ProofItem = {
  key: ProofKey;
  title: string;
  description?: string;
  /** Where to learn more, e.g. the Silk Mark verification guide. */
  href?: string;
};

const PROOF_ICONS: Record<ProofKey, LucideIcon> = {
  silk_mark: BadgeCheckIcon,
  gi_bhagalpur: MapPinIcon,
  handloom: SpoolIcon,
  direct_from_weaver: HandHeartIcon,
};

/**
 * Default "Why Bahram" copy for the home page. No Silk Mark claim: the store does not record
 * Silk Mark labels (owner's decision, 2026-11-05), so it must not promise them.
 */
export const WHY_BAHRAM_PROOF_ITEMS: readonly ProofItem[] = [
  {
    key: "silk_mark",
    title: "Fibre stated plainly",
    description: "Every piece lists the fibre in warp and weft, so you know exactly what you buy.",
    href: "/guides/silk-types-explained",
  },
  {
    key: "gi_bhagalpur",
    title: "GI Bhagalpur Silk",
    description: "Pieces that qualify are sold as Bhagalpur Silk (GI), registered in 2013.",
    href: "/guides/bhagalpur-silk-guide",
  },
  {
    key: "handloom",
    title: "Handloom",
    description: "Woven on Bhagalpur looms, with the fibre in warp and weft stated plainly.",
    href: "/guides/silk-types-explained",
  },
  {
    key: "direct_from_weaver",
    title: "Direct from the weaver",
    description: "No middlemen. Weavers are credited by name wherever they agree.",
    href: "/weavers",
  },
];

type ProofStripProps = Omit<React.ComponentProps<"section">, "children"> & {
  items: readonly ProofItem[];
  /** Accessible name for the region. */
  label?: string;
  /** Compact single row for product pages: icon and title only. */
  compact?: boolean;
  /** Constrain items to the page container (full-bleed band). Turn off when already inside one. */
  contained?: boolean;
};

function ProofStrip({
  items,
  label = "Why Bahram Silks",
  compact = false,
  contained = true,
  className,
  ...props
}: ProofStripProps) {
  return (
    <section
      data-slot="proof-strip"
      aria-label={label}
      className={cn("border-y border-gold-200 bg-card", className)}
      {...props}
    >
      <ul
        className={cn(
          "grid grid-cols-2 lg:grid-cols-4",
          contained && "container-page",
          compact ? "gap-x-4 gap-y-3 py-3" : "gap-x-6 gap-y-8 py-8",
        )}
      >
        {items.map((item) => (
          <ProofStripItem key={item.key} item={item} compact={compact} />
        ))}
      </ul>
    </section>
  );
}

function ProofStripItem({ item, compact }: { item: ProofItem; compact: boolean }) {
  const Icon = PROOF_ICONS[item.key];
  const title = item.href ? (
    <Link
      href={item.href}
      className="rounded-sm underline-offset-4 hover:text-primary hover:underline"
    >
      {item.title}
    </Link>
  ) : (
    item.title
  );

  return (
    <li
      className={cn(
        "flex gap-3",
        compact
          ? "items-center"
          : "flex-col items-center text-center sm:flex-row sm:items-start sm:text-left",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-accent text-gold-text",
          compact ? "size-8" : "size-11",
        )}
      >
        <Icon className={compact ? "size-4" : "size-5"} aria-hidden />
      </span>
      <span className="grid gap-1">
        <span className={cn("font-medium text-foreground", compact ? "text-sm" : "text-base")}>
          {title}
        </span>
        {!compact && item.description && (
          <span className="text-sm text-muted-foreground">{item.description}</span>
        )}
      </span>
    </li>
  );
}

export { ProofStrip, type ProofStripProps };
