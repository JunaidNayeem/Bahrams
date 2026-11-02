import { describe, expect, it } from "vitest";
import {
  financialYearOf,
  financialYearStarting,
  formatCreditNoteNumber,
  formatInvoiceNumber,
  formatOrderNumber,
  isValidOrderNumber,
  parseOrderNumber,
} from "./numbering";

describe("financial year", () => {
  it("runs April to March in IST", () => {
    expect(financialYearOf("2026-10-31T06:30:00Z").label).toBe("2026-27");
    expect(financialYearOf("2027-03-31T18:29:59Z").label).toBe("2026-27"); // 23:59:59 IST, 31 Mar
    expect(financialYearOf("2027-03-31T18:30:00Z").label).toBe("2027-28"); // 00:00 IST, 1 Apr
    expect(financialYearOf("2026-01-15T00:00:00Z").label).toBe("2025-26");
  });

  it("handles the century turn and exposes boundaries", () => {
    const fy = financialYearStarting(2099);
    expect(fy.label).toBe("2099-00");
    expect(fy.code).toBe("9900");
    const current = financialYearOf("2026-10-31T06:30:00Z");
    expect(current.code).toBe("2627");
    expect(current.startsAt.toISOString()).toBe("2026-03-31T18:30:00.000Z");
    expect(current.endsBefore.toISOString()).toBe("2027-03-31T18:30:00.000Z");
  });
});

describe("document numbers", () => {
  const at = "2026-10-31T06:30:00Z";

  it("formats order, invoice and credit note numbers", () => {
    expect(formatOrderNumber(123, at)).toBe("BS-2627-000123");
    expect(formatInvoiceNumber(123, at)).toBe("BSI/2627/000123");
    expect(formatCreditNoteNumber(12, at)).toBe("BSC/2627/000012");
  });

  it("keeps GST document numbers within 16 characters", () => {
    expect(formatInvoiceNumber(999_999, at).length).toBeLessThanOrEqual(16);
    expect(formatCreditNoteNumber(999_999, at).length).toBeLessThanOrEqual(16);
  });

  it("rejects out-of-range sequences", () => {
    expect(() => formatOrderNumber(0, at)).toThrow(RangeError);
    expect(() => formatOrderNumber(1_000_000, at)).toThrow(RangeError);
    expect(() => formatInvoiceNumber(1.5, at)).toThrow(RangeError);
  });

  it("parses order numbers leniently but strictly validates them", () => {
    expect(parseOrderNumber(" #bs-2627-000123 ")).toEqual({
      financialYearCode: "2627",
      sequence: 123,
    });
    expect(parseOrderNumber("BS-9900-000001")).toEqual({ financialYearCode: "9900", sequence: 1 });
    expect(parseOrderNumber("BS-2628-000123")).toBeNull(); // years must be consecutive
    expect(parseOrderNumber("BS-2627-000000")).toBeNull();
    expect(parseOrderNumber("BS-2627-123")).toBeNull();
    expect(isValidOrderNumber("BS-2627-000123")).toBe(true);
    expect(isValidOrderNumber("ORD123")).toBe(false);
  });
});
