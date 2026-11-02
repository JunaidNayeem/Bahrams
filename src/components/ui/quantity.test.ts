import { describe, expect, it } from "vitest";

import { formatQuantity, normalizeQuantity, parseQuantity, stepQuantity } from "./quantity";

const metres = { min: 0.5, max: 10, step: 0.5 } as const;
const pieces = { min: 1, max: 3, step: 1 } as const;

describe("normalizeQuantity", () => {
  it("snaps metres to 0.5 steps", () => {
    expect(normalizeQuantity(2.3, metres)).toBe(2.5);
    expect(normalizeQuantity(2.2, metres)).toBe(2);
    expect(normalizeQuantity(0.1 + 0.2, metres)).toBe(0.5);
  });

  it("clamps into range", () => {
    expect(normalizeQuantity(0, metres)).toBe(0.5);
    expect(normalizeQuantity(99, metres)).toBe(10);
    expect(normalizeQuantity(5, pieces)).toBe(3);
  });

  it("keeps the max on the step grid", () => {
    expect(normalizeQuantity(9.9, { min: 1, max: 9.9, step: 0.5 })).toBe(9.5);
  });

  it("treats non-finite input as the minimum", () => {
    expect(normalizeQuantity(Number.NaN, pieces)).toBe(1);
  });
});

describe("stepQuantity", () => {
  it("steps by 0.5 m without float drift", () => {
    let value = 0.5;
    for (let i = 0; i < 9; i++) value = stepQuantity(value, 1, metres);
    expect(value).toBe(5);
  });

  it("stops at the bounds", () => {
    expect(stepQuantity(3, 1, pieces)).toBe(3);
    expect(stepQuantity(1, -1, pieces)).toBe(1);
  });
});

describe("parseQuantity", () => {
  it("accepts dot or comma decimals", () => {
    expect(parseQuantity(" 2.5 ")).toBe(2.5);
    expect(parseQuantity("2,5")).toBe(2.5);
    expect(parseQuantity("3")).toBe(3);
  });

  it("rejects non-numbers", () => {
    expect(parseQuantity("")).toBeNull();
    expect(parseQuantity("two")).toBeNull();
    expect(parseQuantity("-1")).toBeNull();
    expect(parseQuantity("1e3")).toBeNull();
  });
});

describe("formatQuantity", () => {
  it("pluralises units", () => {
    expect(formatQuantity(1, "piece")).toBe("1 piece");
    expect(formatQuantity(2, "piece")).toBe("2 pieces");
    expect(formatQuantity(2.5, "metre")).toBe("2.5 metres");
    expect(formatQuantity(1, "metre")).toBe("1 metre");
  });
});
