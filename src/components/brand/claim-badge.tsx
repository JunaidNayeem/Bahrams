import {
  BadgeCheckIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SpoolIcon,
  type LucideIcon,
} from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Visual keys for authenticity claims. Kept local to the design system; the eligibility rules
 * (and the canonical claim type) live in src/lib/domain/claims.
 */
export type ClaimBadgeKey =
  "pure_silk" | "silk_mark" | "handloom" | "handloom_mark" | "gi_bhagalpur";

const CLAIM_ICONS: Record<ClaimBadgeKey, LucideIcon> = {
  pure_silk: ShieldCheckIcon,
  silk_mark: BadgeCheckIcon,
  handloom: SpoolIcon,
  handloom_mark: SpoolIcon,
  gi_bhagalpur: MapPinIcon,
};

type ClaimBadgeProps = Omit<React.ComponentProps<"span">, "children"> & {
  claim: ClaimBadgeKey;
  /** Text to show, e.g. "Silk Mark" or "Bhagalpur Silk (GI)". */
  label: string;
  /** Supporting record, e.g. the Silk Mark label number. */
  detail?: string;
  size?: "sm" | "default";
};

/**
 * Pill that DISPLAYS a claim. It never decides whether the claim is true: render it only after
 * src/lib/domain/claims has confirmed the matching record exists for this product.
 */
function ClaimBadge({
  claim,
  label,
  detail,
  size = "default",
  className,
  ...props
}: ClaimBadgeProps) {
  const Icon = CLAIM_ICONS[claim];
  return (
    <span
      data-slot="claim-badge"
      data-claim={claim}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border border-gold-300 bg-gold-50 font-medium text-gold-800",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className,
      )}
      {...props}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      <span>{label}</span>
      {detail && (
        <>
          <span aria-hidden className="text-gold-600">
            ·
          </span>
          <span className="font-normal tabular-nums">{detail}</span>
        </>
      )}
    </span>
  );
}

export { ClaimBadge, type ClaimBadgeProps };
