/**
 * Money is integer paise (₹1 = 100 paise) everywhere: database columns, domain maths and
 * component props. Fractions only exist inside a single calculation, which is done in exact
 * integer (BigInt) arithmetic and rounded half-up back to paise.
 */

export type Paise = number;

export const PAISE_PER_RUPEE = 100;

export function isPaise(value: unknown): value is Paise {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export function assertPaise(value: number, label = "amount"): Paise {
  if (!isPaise(value)) {
    throw new RangeError(`${label} must be a whole number of paise, got ${value}`);
  }
  return value;
}

function assertSafeResult(value: number): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Money calculation overflowed: ${value}`);
  }
  return value;
}

/** Removes binary floating-point noise such as 1.005 * 100 = 100.49999999999999. */
function denoise(value: number): number {
  return Number(value.toPrecision(15));
}

/** Rounds half away from zero (2.5 → 3, −2.5 → −3), the usual convention on invoices. */
export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError(`Cannot round ${value}`);
  const clean = denoise(value);
  const rounded = Math.sign(clean) * Math.floor(Math.abs(clean) + 0.5);
  return rounded === 0 ? 0 : rounded;
}

/** Exact `a × b ÷ c` for safe integers, rounded half away from zero. */
export function mulDivRoundHalfUp(a: number, b: number, c: number): number {
  for (const [name, v] of [
    ["a", a],
    ["b", b],
    ["c", c],
  ] as const) {
    if (!Number.isSafeInteger(v)) throw new RangeError(`${name} must be a safe integer, got ${v}`);
  }
  if (c === 0) throw new RangeError("Division by zero");
  const numerator = BigInt(a) * BigInt(b);
  const denominator = BigInt(c);
  const negative = numerator < BigInt(0) !== denominator < BigInt(0);
  const n = numerator < BigInt(0) ? -numerator : numerator;
  const d = denominator < BigInt(0) ? -denominator : denominator;
  let quotient = n / d;
  if ((n % d) * BigInt(2) >= d) quotient += BigInt(1);
  const result = Number(negative ? -quotient : quotient);
  return assertSafeResult(result === 0 ? 0 : result);
}

/** Factors (quantities, percentages) are supported to 4 decimal places, e.g. 2.5 m or 12.75 %. */
const FACTOR_SCALE = 10_000;

function scaleFactor(factor: number): number {
  if (!Number.isFinite(factor)) throw new RangeError(`Invalid factor ${factor}`);
  const scaled = roundHalfUp(factor * FACTOR_SCALE);
  if (Math.abs(scaled / FACTOR_SCALE - factor) > 1e-9) {
    throw new RangeError(`Factor ${factor} has more than 4 decimal places`);
  }
  return scaled;
}

export function rupeesToPaise(rupees: number | string): Paise {
  let value: number;
  if (typeof rupees === "string") {
    const cleaned = rupees.replace(/[₹,\s]/g, "").replace(/^Rs\.?/i, "");
    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) throw new RangeError(`Not a rupee amount: "${rupees}"`);
    value = Number(cleaned);
  } else {
    value = rupees;
  }
  return assertSafeResult(roundHalfUp(value * PAISE_PER_RUPEE));
}

export function paiseToRupees(paise: Paise): number {
  return assertPaise(paise) / PAISE_PER_RUPEE;
}

export function addPaise(...amounts: Paise[]): Paise {
  return sumPaise(amounts);
}

export function sumPaise(amounts: Iterable<Paise>): Paise {
  let total = 0;
  for (const amount of amounts) total += assertPaise(amount);
  return assertSafeResult(total);
}

export function subtractPaise(minuend: Paise, subtrahend: Paise): Paise {
  return assertSafeResult(assertPaise(minuend) - assertPaise(subtrahend));
}

/** `amount × factor`, rounded half-up to the paisa. Used for unit price × quantity (e.g. 2.5 m). */
export function multiplyPaise(amount: Paise, factor: number): Paise {
  return mulDivRoundHalfUp(assertPaise(amount), scaleFactor(factor), FACTOR_SCALE);
}

/** `percent` % of `amount`, rounded half-up to the paisa. */
export function percentOf(amount: Paise, percent: number): Paise {
  return mulDivRoundHalfUp(assertPaise(amount), scaleFactor(percent), 100 * FACTOR_SCALE);
}

export function clampNonNegative(amount: Paise): Paise {
  return Math.max(0, assertPaise(amount));
}

export function minPaise(...amounts: Paise[]): Paise {
  return Math.min(...amounts.map((a) => assertPaise(a)));
}

/**
 * Splits `total` across `weights` so the parts always sum to `total` exactly (largest
 * remainder method; ties go to the earlier item). Used to spread order-level discounts and
 * charges over lines for GST. With all-zero weights the total is split evenly.
 */
export function allocateProportionally(total: Paise, weights: readonly number[]): Paise[] {
  assertPaise(total, "total");
  if (total < 0) throw new RangeError("Cannot allocate a negative total");
  if (weights.length === 0) {
    if (total !== 0) throw new RangeError("Cannot allocate a non-zero total across no items");
    return [];
  }
  for (const w of weights) {
    if (!Number.isSafeInteger(w) || w < 0) {
      throw new RangeError(`Weights must be non-negative integers, got ${w}`);
    }
  }
  const effective = weights.every((w) => w === 0) ? weights.map(() => 1) : weights;
  const T = BigInt(total);
  const S = effective.reduce((sum, w) => sum + BigInt(w), BigInt(0));
  const parts = effective.map((w, index) => {
    const product = T * BigInt(w);
    return { index, base: product / S, remainder: product % S };
  });
  let leftover = T - parts.reduce((sum, p) => sum + p.base, BigInt(0));
  const byRemainder = [...parts].sort((x, y) =>
    x.remainder === y.remainder ? x.index - y.index : x.remainder > y.remainder ? -1 : 1,
  );
  for (const part of byRemainder) {
    if (leftover === BigInt(0)) break;
    part.base += BigInt(1);
    leftover -= BigInt(1);
  }
  return parts.map((p) => Number(p.base));
}

/** Indian digit grouping: 1234567 → "12,34,567". */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${lastThree}`;
}

export interface FormatINROptions {
  /** Drop ".00" for whole-rupee amounts (storefront prices). Non-zero paise always show. */
  omitZeroPaise?: boolean;
  /** Prefix with ₹ (default true). */
  symbol?: boolean;
}

/** Formats paise as Indian rupees: 12345600 → "₹1,23,456.00". */
export function formatINR(paise: Paise, options: FormatINROptions = {}): string {
  assertPaise(paise);
  const { omitZeroPaise = false, symbol = true } = options;
  const abs = Math.abs(paise);
  const rupees = groupIndian(String(Math.floor(abs / PAISE_PER_RUPEE)));
  const fraction = abs % PAISE_PER_RUPEE;
  const decimals = omitZeroPaise && fraction === 0 ? "" : `.${String(fraction).padStart(2, "0")}`;
  return `${paise < 0 ? "-" : ""}${symbol ? "₹" : ""}${rupees}${decimals}`;
}
