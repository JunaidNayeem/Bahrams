/**
 * Bhagalpuri stripe and check patterns as CSS gradients. Stripes of uneven width, like the
 * cluster's woven borders, are written as [colour, width-in-px] bands and repeated.
 */

export type StripeBandStop = readonly [color: string, widthPx: number];

export type StripeColorway = "madder" | "indigo" | "leaf" | "tussar";

const v = (token: string) => `var(--color-${token})`;

export const STRIPE_COLORWAYS: Record<StripeColorway, readonly StripeBandStop[]> = {
  madder: [
    [v("madder-700"), 10],
    [v("gold-400"), 2],
    [v("madder-700"), 4],
    [v("ivory-100"), 2],
    [v("indigo-700"), 6],
    [v("gold-400"), 2],
    [v("madder-800"), 14],
    [v("charcoal-900"), 1],
  ],
  indigo: [
    [v("indigo-700"), 10],
    [v("gold-300"), 2],
    [v("indigo-800"), 4],
    [v("ivory-100"), 2],
    [v("madder-600"), 4],
    [v("indigo-700"), 12],
    [v("gold-300"), 1],
  ],
  leaf: [
    [v("leaf-700"), 10],
    [v("gold-400"), 2],
    [v("leaf-800"), 4],
    [v("ivory-100"), 2],
    [v("madder-700"), 4],
    [v("leaf-700"), 12],
    [v("gold-400"), 1],
  ],
  tussar: [
    [v("gold-300"), 10],
    [v("gold-500"), 2],
    [v("ivory-200"), 4],
    [v("madder-700"), 2],
    [v("gold-400"), 8],
    [v("charcoal-800"), 1],
    [v("gold-200"), 6],
  ],
};

/** `repeating-linear-gradient` with hard colour stops for the given bands. */
export function stripeGradient(stops: readonly StripeBandStop[], angleDeg = 90): string {
  let offset = 0;
  const parts = stops.map(([color, width]) => {
    const part = `${color} ${offset}px ${offset + width}px`;
    offset += width;
    return part;
  });
  return `repeating-linear-gradient(${angleDeg}deg, ${parts.join(", ")})`;
}

/** Translucent cross stripes laid over the warp stripes turn a stripe into a check. */
export function checkGradient(stops: readonly StripeBandStop[]): string {
  const weft = stops.map(
    ([color, width]) => [`color-mix(in srgb, ${color} 45%, transparent)`, width] as const,
  );
  return `${stripeGradient(weft, 0)}, ${stripeGradient(stops, 90)}`;
}
