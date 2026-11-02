import { describe, expect, it } from "vitest";
import {
  addPaise,
  allocateProportionally,
  assertPaise,
  clampNonNegative,
  formatINR,
  isPaise,
  minPaise,
  mulDivRoundHalfUp,
  multiplyPaise,
  paiseToRupees,
  percentOf,
  roundHalfUp,
  rupeesToPaise,
  subtractPaise,
  sumPaise,
} from "./money";

describe("isPaise / assertPaise", () => {
  it("accepts safe integers only", () => {
    expect(isPaise(0)).toBe(true);
    expect(isPaise(-500)).toBe(true);
    expect(isPaise(12.5)).toBe(false);
    expect(isPaise("100")).toBe(false);
    expect(isPaise(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    expect(isPaise(Number.NaN)).toBe(false);
  });

  it("throws a labelled error for non-integers", () => {
    expect(assertPaise(100)).toBe(100);
    expect(() => assertPaise(1.5, "price")).toThrow(/price must be a whole number of paise/);
  });
});

describe("roundHalfUp", () => {
  it.each([
    [2.5, 3],
    [2.4999, 2],
    [-2.5, -3],
    [-2.4, -2],
    [0, 0],
    [1.005 * 100, 101], // float noise: 100.49999999999999
  ])("rounds %s to %s", (input, expected) => {
    expect(roundHalfUp(input)).toBe(expected);
  });

  it("never returns negative zero", () => {
    expect(Object.is(roundHalfUp(-0.4), 0)).toBe(true);
  });

  it("rejects non-finite input", () => {
    expect(() => roundHalfUp(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("mulDivRoundHalfUp", () => {
  it("rounds exact halves away from zero", () => {
    expect(mulDivRoundHalfUp(5, 1, 2)).toBe(3);
    expect(mulDivRoundHalfUp(-5, 1, 2)).toBe(-3);
    expect(mulDivRoundHalfUp(5, -1, 2)).toBe(-3);
    expect(mulDivRoundHalfUp(7, 1, 3)).toBe(2);
    expect(mulDivRoundHalfUp(-1, 1, 3)).toBe(0);
  });

  it("is exact beyond float precision", () => {
    // 9e15 * 3 overflows 2^53 as a float product but is exact with BigInt.
    expect(mulDivRoundHalfUp(9_000_000_000_000_000 / 10, 3, 3)).toBe(900_000_000_000_000);
  });

  it("rejects bad operands", () => {
    expect(() => mulDivRoundHalfUp(1, 1, 0)).toThrow(/Division by zero/);
    expect(() => mulDivRoundHalfUp(1.5, 1, 1)).toThrow(/a must be a safe integer/);
    expect(() => mulDivRoundHalfUp(Number.MAX_SAFE_INTEGER, 2, 1)).toThrow(/overflowed/);
  });
});

describe("rupeesToPaise / paiseToRupees", () => {
  it.each([
    [4800, 480_000],
    [0.1 + 0.2, 30],
    [1.005, 101],
    [-12.345, -1235],
    ["₹1,23,456.78", 12_345_678],
    ["Rs. 499", 49_900],
    [" 2,500.5 ", 250_050],
  ] as const)("converts %s", (input, expected) => {
    expect(rupeesToPaise(input)).toBe(expected);
  });

  it("rejects text that is not an amount", () => {
    expect(() => rupeesToPaise("twelve")).toThrow(RangeError);
    expect(() => rupeesToPaise("1.2.3")).toThrow(RangeError);
  });

  it("converts back to rupees", () => {
    expect(paiseToRupees(480_050)).toBe(4800.5);
  });
});

describe("arithmetic", () => {
  it("adds, sums and subtracts integers", () => {
    expect(addPaise(100, 250, 1)).toBe(351);
    expect(addPaise()).toBe(0);
    expect(sumPaise(new Set([1, 2, 3]))).toBe(6);
    expect(subtractPaise(500, 750)).toBe(-250);
    expect(() => addPaise(1, 0.5)).toThrow(RangeError);
    expect(() => subtractPaise(1, 0.5)).toThrow(RangeError);
  });

  it("multiplies by fractional quantities with half-up rounding", () => {
    expect(multiplyPaise(129_900, 2.5)).toBe(324_750);
    expect(multiplyPaise(333, 0.5)).toBe(167); // 166.5 → 167
    expect(multiplyPaise(1001, 1.5)).toBe(1502); // 1501.5 → 1502
    expect(multiplyPaise(100, 0)).toBe(0);
  });

  it("rejects factors beyond 4 decimal places or non-finite", () => {
    expect(() => multiplyPaise(100, 1.23456)).toThrow(/4 decimal places/);
    expect(() => multiplyPaise(100, Number.NaN)).toThrow(RangeError);
  });

  it("computes percentages with half-up rounding", () => {
    expect(percentOf(480_000, 10)).toBe(48_000);
    expect(percentOf(999, 5)).toBe(50); // 49.95 → 50
    expect(percentOf(1, 50)).toBe(1); // 0.5 → 1
    expect(percentOf(10_000, 12.75)).toBe(1275);
  });

  it("clamps and takes minimums", () => {
    expect(clampNonNegative(-5)).toBe(0);
    expect(clampNonNegative(5)).toBe(5);
    expect(minPaise(300, 200, 500)).toBe(200);
  });
});

describe("allocateProportionally", () => {
  it("always sums to the total", () => {
    const parts = allocateProportionally(100, [1, 1, 1]);
    expect(parts).toEqual([34, 33, 33]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("follows the weights", () => {
    expect(allocateProportionally(1000, [300_000, 100_000])).toEqual([750, 250]);
  });

  it("gives leftover paise to the largest remainders", () => {
    // exact shares 2.5, 3.333…, 4.1666… → floors 2,3,4 (9), one paisa to the 0.5 remainder
    expect(allocateProportionally(10, [15, 20, 25])).toEqual([3, 3, 4]);
  });

  it("splits evenly when all weights are zero", () => {
    expect(allocateProportionally(5, [0, 0])).toEqual([3, 2]);
  });

  it("handles empty inputs and zero totals", () => {
    expect(allocateProportionally(0, [])).toEqual([]);
    expect(allocateProportionally(0, [5, 5])).toEqual([0, 0]);
    expect(() => allocateProportionally(10, [])).toThrow(RangeError);
  });

  it("rejects negative totals and invalid weights", () => {
    expect(() => allocateProportionally(-1, [1])).toThrow(RangeError);
    expect(() => allocateProportionally(10, [-1, 2])).toThrow(RangeError);
    expect(() => allocateProportionally(10, [1.5])).toThrow(RangeError);
  });

  it("stays exact with large values", () => {
    const parts = allocateProportionally(9_999_999_999, [9_999_999_999, 1, 7]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(9_999_999_999);
  });
});

describe("formatINR", () => {
  it.each([
    [0, "₹0.00"],
    [5, "₹0.05"],
    [99_900, "₹999.00"],
    [100_000, "₹1,000.00"],
    [12_345_600, "₹1,23,456.00"],
    [123_456_789, "₹12,34,567.89"],
    [10_000_000_000, "₹10,00,00,000.00"],
    [-50_000, "-₹500.00"],
  ])("formats %s paise as %s", (paise, expected) => {
    expect(formatINR(paise)).toBe(expected);
  });

  it("can omit .00 but keeps real paise", () => {
    expect(formatINR(480_000, { omitZeroPaise: true })).toBe("₹4,800");
    expect(formatINR(480_050, { omitZeroPaise: true })).toBe("₹4,800.50");
  });

  it("can drop the symbol", () => {
    expect(formatINR(12_345_600, { symbol: false })).toBe("1,23,456.00");
  });

  it("rejects fractional paise", () => {
    expect(() => formatINR(1.5)).toThrow(RangeError);
  });
});
