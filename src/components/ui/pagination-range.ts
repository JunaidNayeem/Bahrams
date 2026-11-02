export type PaginationEntry = number | "ellipsis-start" | "ellipsis-end";

/**
 * Page numbers to render for `current` of `total` (both 1-based): always the first and last
 * page plus `siblings` either side of the current one, with ellipses for the gaps. A gap of a
 * single page shows that page instead of an ellipsis.
 */
export function paginationRange(current: number, total: number, siblings = 1): PaginationEntry[] {
  if (total <= 0) return [];
  const page = Math.min(Math.max(1, Math.trunc(current)), total);
  // first + last + current + siblings + two ellipsis slots
  const slots = siblings * 2 + 5;
  if (total <= slots) return range(1, total);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, total);
  const showStartGap = left > 3;
  const showEndGap = right < total - 2;

  if (!showStartGap) {
    return [...range(1, Math.max(right, slots - 2)), "ellipsis-end", total];
  }
  if (!showEndGap) {
    return [1, "ellipsis-start", ...range(Math.min(left, total - (slots - 3)), total)];
  }
  return [1, "ellipsis-start", ...range(left, right), "ellipsis-end", total];
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
