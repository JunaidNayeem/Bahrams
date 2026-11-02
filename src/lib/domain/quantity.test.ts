import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_METRES,
  DEFAULT_MAX_PIECES,
  formatQuantity,
  isOnStep,
  limitToAvailable,
  normaliseQuantity,
  quantityRuleFor,
  stepQuantity,
  validateQuantity,
} from "./quantity";

const pieces = quantityRuleFor("piece");
const metres = quantityRuleFor("metre");

describe("quantityRuleFor", () => {
  it("has sensible defaults per unit", () => {
    expect(pieces).toEqual({ unit: "piece", min: 1, max: DEFAULT_MAX_PIECES, step: 1 });
    expect(metres).toEqual({ unit: "metre", min: 1, max: DEFAULT_MAX_METRES, step: 0.5 });
  });

  it("accepts overrides on the step grid", () => {
    expect(quantityRuleFor("metre", { min: 2.5, max: 20 })).toMatchObject({ min: 2.5, max: 20 });
  });

  it("rejects invalid configuration", () => {
    expect(() => quantityRuleFor("metre", { min: 0.75 })).toThrow(RangeError);
    expect(() => quantityRuleFor("piece", { min: 0 })).toThrow(RangeError);
    expect(() => quantityRuleFor("piece", { min: 1.5 })).toThrow(RangeError);
    expect(() => quantityRuleFor("piece", { min: 5, max: 2 })).toThrow(RangeError);
    expect(() => quantityRuleFor("metre", { max: 10.25 })).toThrow(RangeError);
  });
});

describe("validateQuantity", () => {
  it("accepts valid quantities", () => {
    expect(validateQuantity(1, pieces)).toEqual({ valid: true, quantity: 1 });
    expect(validateQuantity(2.5, metres)).toEqual({ valid: true, quantity: 2.5 });
    expect(validateQuantity(0.1 * 3 + 0.2 + 1, metres)).toEqual({ valid: true, quantity: 1.5 });
  });

  it.each([
    [Number.NaN, pieces, "not_a_number"],
    [1.5, pieces, "not_whole_piece"],
    [1.25, metres, "not_on_step"],
    [0, pieces, "below_minimum"],
    [0.5, metres, "below_minimum"],
    [11, pieces, "above_maximum"],
    [100.5, metres, "above_maximum"],
  ] as const)("rejects %s for %o", (quantity, rule, issue) => {
    const result = validateQuantity(quantity, rule);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issue).toBe(issue);
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("explains the step and minimum in shopper words", () => {
    const step = validateQuantity(1.2, metres);
    expect(step.valid || step.message).toBe("Fabric is cut in 0.5 m steps.");
    const min = validateQuantity(0.5, metres);
    expect(min.valid || min.message).toBe("The minimum is 1 m.");
  });
});

describe("normaliseQuantity and stepQuantity", () => {
  it("snaps half-up to the step and clamps", () => {
    expect(normaliseQuantity(1.25, metres)).toBe(1.5);
    expect(normaliseQuantity(1.24, metres)).toBe(1);
    expect(normaliseQuantity(0.2, metres)).toBe(1);
    expect(normaliseQuantity(500, metres)).toBe(DEFAULT_MAX_METRES);
    expect(normaliseQuantity(2.6, pieces)).toBe(3);
    expect(normaliseQuantity(Number.NaN, pieces)).toBe(1);
  });

  it("steps up and down within bounds", () => {
    expect(stepQuantity(1, 1, metres)).toBe(1.5);
    expect(stepQuantity(1, -1, metres)).toBe(1);
    expect(stepQuantity(10, 1, pieces)).toBe(10);
    expect(stepQuantity(3, -1, pieces)).toBe(2);
  });
});

describe("limitToAvailable", () => {
  it("caps the maximum at stock, rounded down to the step", () => {
    expect(limitToAvailable(metres, 7.8)).toMatchObject({ max: 7.5 });
    expect(limitToAvailable(pieces, 1)).toMatchObject({ min: 1, max: 1 });
    expect(limitToAvailable(pieces, 50)).toMatchObject({ max: DEFAULT_MAX_PIECES });
  });

  it("returns null when less than the minimum is in stock", () => {
    expect(limitToAvailable(metres, 0.5)).toBeNull();
    expect(limitToAvailable(pieces, 0)).toBeNull();
  });
});

describe("helpers", () => {
  it("formats quantities", () => {
    expect(formatQuantity(1, "piece")).toBe("1 piece");
    expect(formatQuantity(3, "piece")).toBe("3 pieces");
    expect(formatQuantity(2.5, "metre")).toBe("2.5 m");
  });

  it("checks the step grid", () => {
    expect(isOnStep(3.5, 0.5)).toBe(true);
    expect(isOnStep(3.3, 0.5)).toBe(false);
  });
});
