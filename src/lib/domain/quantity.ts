import type { SellUnit } from "./enums";

/**
 * Sell-unit rules. Pieces (sarees, stoles…) are whole numbers ≥ 1. Fabric is priced per metre
 * and bought in 0.5 m steps with a minimum cut (default 1 m).
 */

export const METRE_STEP = 0.5;
export const DEFAULT_MIN_METRES = 1;
/** Per cart line; stock limits are applied separately with `limitToAvailable`. */
export const DEFAULT_MAX_METRES = 100;
export const DEFAULT_MAX_PIECES = 10;

export interface QuantityRule {
  unit: SellUnit;
  min: number;
  max: number;
  step: number;
}

const EPSILON = 1e-9;

export function isOnStep(quantity: number, step: number): boolean {
  const ratio = quantity / step;
  return Math.abs(ratio - Math.round(ratio)) < EPSILON;
}

/** Clears float noise from step arithmetic (0.1 + 0.2 style) by snapping to the step grid. */
function snapToGrid(quantity: number, step: number): number {
  return Math.round(quantity / step) * step;
}

export function quantityRuleFor(
  unit: SellUnit,
  overrides: { min?: number; max?: number } = {},
): QuantityRule {
  const step = unit === "metre" ? METRE_STEP : 1;
  const min = overrides.min ?? (unit === "metre" ? DEFAULT_MIN_METRES : 1);
  const max = overrides.max ?? (unit === "metre" ? DEFAULT_MAX_METRES : DEFAULT_MAX_PIECES);
  if (!(min > 0) || !isOnStep(min, step)) {
    throw new RangeError(`Minimum ${min} is not a valid ${unit} quantity`);
  }
  if (!isOnStep(max, step) || max < min) {
    throw new RangeError(`Maximum ${max} is not a valid ${unit} quantity for minimum ${min}`);
  }
  return { unit, min, max, step };
}

export type QuantityIssue =
  "not_a_number" | "not_whole_piece" | "not_on_step" | "below_minimum" | "above_maximum";

export type QuantityValidation =
  { valid: true; quantity: number } | { valid: false; issue: QuantityIssue; message: string };

export function formatQuantity(quantity: number, unit: SellUnit): string {
  if (unit === "metre") return `${quantity} m`;
  return `${quantity} ${quantity === 1 ? "piece" : "pieces"}`;
}

export function validateQuantity(quantity: number, rule: QuantityRule): QuantityValidation {
  const fail = (issue: QuantityIssue, message: string): QuantityValidation => ({
    valid: false,
    issue,
    message,
  });
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    return fail("not_a_number", "Enter a quantity.");
  }
  if (!isOnStep(quantity, rule.step)) {
    return rule.unit === "piece"
      ? fail("not_whole_piece", "Choose a whole number of pieces.")
      : fail("not_on_step", `Fabric is cut in ${formatQuantity(rule.step, "metre")} steps.`);
  }
  if (quantity < rule.min - EPSILON) {
    return fail("below_minimum", `The minimum is ${formatQuantity(rule.min, rule.unit)}.`);
  }
  if (quantity > rule.max + EPSILON) {
    return fail("above_maximum", `The maximum is ${formatQuantity(rule.max, rule.unit)}.`);
  }
  return { valid: true, quantity: snapToGrid(quantity, rule.step) };
}

/** Coerces any input to the nearest valid quantity (half-up to the step, then clamped). */
export function normaliseQuantity(quantity: number, rule: QuantityRule): number {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) return rule.min;
  const snapped = Math.floor(quantity / rule.step + 0.5 + EPSILON) * rule.step;
  return Math.min(rule.max, Math.max(rule.min, snapToGrid(snapped, rule.step)));
}

/** One click of a quantity stepper. */
export function stepQuantity(current: number, direction: 1 | -1, rule: QuantityRule): number {
  return normaliseQuantity(normaliseQuantity(current, rule) + direction * rule.step, rule);
}

/**
 * Caps the rule's maximum at what is in stock (rounded down to the step). Returns null when
 * less than the minimum is available, i.e. the item cannot be bought.
 */
export function limitToAvailable(rule: QuantityRule, available: number): QuantityRule | null {
  const flooredAvailable = Math.floor(available / rule.step + EPSILON) * rule.step;
  const max = Math.min(rule.max, snapToGrid(flooredAvailable, rule.step));
  if (max < rule.min) return null;
  return { ...rule, max };
}
