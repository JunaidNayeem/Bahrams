import { describe, expect, it } from "vitest";
import {
  addIstBusinessDays,
  addIstMonths,
  endOfIstDay,
  isIstBusinessDay,
  istDate,
  istMidnight,
  istParts,
  startOfIstDay,
  toDate,
} from "./time";

describe("IST helpers", () => {
  it("reads the IST calendar date regardless of host time zone", () => {
    // 20:00 UTC on 31 Oct is 01:30 IST on 1 Nov.
    expect(istDate("2026-10-31T20:00:00Z")).toBe("2026-11-01");
    expect(istParts("2026-10-31T20:00:00Z")).toMatchObject({
      year: 2026,
      month: 11,
      day: 1,
      hour: 1,
      minute: 30,
      weekday: 0,
    });
  });

  it("finds IST midnight and end of day", () => {
    expect(istMidnight(2026, 11, 1).toISOString()).toBe("2026-10-31T18:30:00.000Z");
    expect(startOfIstDay("2026-11-01T10:00:00Z").toISOString()).toBe("2026-10-31T18:30:00.000Z");
    expect(endOfIstDay("2026-11-01T10:00:00Z").toISOString()).toBe("2026-11-01T18:29:59.999Z");
  });

  it("rejects invalid dates", () => {
    expect(() => toDate("not a date")).toThrow(RangeError);
    const original = new Date("2026-01-01T00:00:00Z");
    expect(toDate(original)).not.toBe(original);
  });

  it("adds months, clamping to the end of shorter months", () => {
    expect(addIstMonths("2026-01-31T04:30:00Z", 1).toISOString()).toBe("2026-02-28T04:30:00.000Z");
    expect(addIstMonths("2028-01-31T04:30:00Z", 1).toISOString()).toBe("2028-02-29T04:30:00.000Z");
    expect(addIstMonths("2026-12-15T04:30:00Z", 1).toISOString()).toBe("2027-01-15T04:30:00.000Z");
    expect(addIstMonths("2026-01-15T04:30:00Z", -1).toISOString()).toBe("2025-12-15T04:30:00.000Z");
  });

  it("skips Sundays and holidays when adding business days", () => {
    const saturday = "2026-10-31T06:30:00Z"; // Sat 31 Oct, 12:00 IST
    expect(isIstBusinessDay(saturday)).toBe(true);
    expect(isIstBusinessDay("2026-11-01T06:30:00Z")).toBe(false); // Sunday
    expect(istDate(addIstBusinessDays(saturday, 1))).toBe("2026-11-02");
    expect(istDate(addIstBusinessDays(saturday, 1, { holidays: ["2026-11-02"] }))).toBe(
      "2026-11-03",
    );
    expect(istDate(addIstBusinessDays(saturday, 0))).toBe("2026-10-31");
    expect(istDate(addIstBusinessDays(saturday, 1, { closedWeekdays: [] }))).toBe("2026-11-01");
  });

  it("rejects fractional or negative business days", () => {
    expect(() => addIstBusinessDays(new Date(), -1)).toThrow(RangeError);
    expect(() => addIstBusinessDays(new Date(), 1.5)).toThrow(RangeError);
  });
});
