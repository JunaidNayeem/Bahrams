/** Quantity maths for the stepper: pieces step by 1, fabric metres by 0.5. */

export type QuantityStep = 1 | 0.5;

export type QuantityBounds = {
  min: number;
  max: number;
  step: QuantityStep;
};

/**
 * Snap to the nearest multiple of `step` (counted from `min`), then clamp into [min, max].
 * Working in integer "steps" avoids float drift such as 0.1 + 0.2.
 */
export function normalizeQuantity(value: number, { min, max, step }: QuantityBounds): number {
  if (!Number.isFinite(value)) return min;
  const steps = Math.round((value - min) / step);
  const snapped = min + steps * step;
  // Largest reachable value that is still on the step grid.
  const maxOnGrid = min + Math.floor((max - min) / step) * step;
  return Math.min(Math.max(snapped, min), maxOnGrid);
}

export function stepQuantity(value: number, direction: 1 | -1, bounds: QuantityBounds): number {
  return normalizeQuantity(normalizeQuantity(value, bounds) + direction * bounds.step, bounds);
}

/** Parses typed input ("2.5", "2,5", " 3 "); returns null when it is not a number. */
export function parseQuantity(input: string): number | null {
  const cleaned = input.trim().replace(",", ".");
  if (cleaned === "" || !/^\d*\.?\d*$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function formatQuantity(value: number, unit: "piece" | "metre"): string {
  if (unit === "metre") return `${value} ${value === 1 ? "metre" : "metres"}`;
  return `${value} ${value === 1 ? "piece" : "pieces"}`;
}
