import { describe, expect, it } from "vitest";

import { formatPaise, paiseToRupeeString } from "./price-format";

describe("formatPaise", () => {
  it("uses Indian digit grouping", () => {
    expect(formatPaise(12345600)).toBe("₹1,23,456");
    expect(formatPaise(1000000000)).toBe("₹1,00,00,000");
  });

  it("omits paise for whole rupees and shows two digits otherwise", () => {
    expect(formatPaise(385000)).toBe("₹3,850");
    expect(formatPaise(145050)).toBe("₹1,450.50");
    expect(formatPaise(5)).toBe("₹0.05");
    expect(formatPaise(0)).toBe("₹0");
  });

  it("rejects non-integer paise", () => {
    expect(() => formatPaise(10.5)).toThrow(TypeError);
    expect(() => formatPaise(Number.NaN)).toThrow(TypeError);
  });
});

describe("paiseToRupeeString", () => {
  it("returns a plain decimal string", () => {
    expect(paiseToRupeeString(385000)).toBe("3850.00");
    expect(paiseToRupeeString(145050)).toBe("1450.50");
    expect(paiseToRupeeString(7)).toBe("0.07");
    expect(paiseToRupeeString(-250)).toBe("-2.50");
  });
});
