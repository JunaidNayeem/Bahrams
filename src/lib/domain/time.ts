/**
 * Calendar helpers pinned to India Standard Time. IST is a fixed UTC+05:30 with no daylight
 * saving, so we shift by a constant offset instead of relying on the host time zone (Vercel
 * runs in UTC, developer machines do not).
 */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const IST_OFFSET_MS = (5 * 60 + 30) * MINUTE_MS;

/** A calendar date in IST, formatted `YYYY-MM-DD`. */
export type IstDate = string;

export type DateInput = Date | string | number;

export function toDate(input: DateInput): Date {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date: ${String(input)}`);
  }
  return date;
}

export interface IstParts {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

export function istParts(input: DateInput): IstParts {
  const shifted = new Date(toDate(input).getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export function istDate(input: DateInput): IstDate {
  const { year, month, day } = istParts(input);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** The instant at which the given IST calendar date begins. */
export function istMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS);
}

export function startOfIstDay(input: DateInput): Date {
  const { year, month, day } = istParts(input);
  return istMidnight(year, month, day);
}

/** Last millisecond of the IST calendar day containing `input`. */
export function endOfIstDay(input: DateInput): Date {
  return new Date(startOfIstDay(input).getTime() + DAY_MS - 1);
}

export function addMinutes(input: DateInput, minutes: number): Date {
  return new Date(toDate(input).getTime() + minutes * MINUTE_MS);
}

export function addHours(input: DateInput, hours: number): Date {
  return new Date(toDate(input).getTime() + hours * HOUR_MS);
}

export function addDays(input: DateInput, days: number): Date {
  return new Date(toDate(input).getTime() + days * DAY_MS);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Adds calendar months in IST, keeping the time of day. The day is clamped to the target
 * month's length (31 Jan + 1 month = 28/29 Feb), which never extends a deadline.
 */
export function addIstMonths(input: DateInput, months: number): Date {
  const date = toDate(input);
  const parts = istParts(date);
  const monthIndex = parts.month - 1 + months;
  const year = parts.year + Math.floor(monthIndex / 12);
  const month = (((monthIndex % 12) + 12) % 12) + 1;
  const day = Math.min(parts.day, daysInMonth(year, month));
  const timeOfDay = date.getTime() - startOfIstDay(date).getTime();
  return new Date(istMidnight(year, month, day).getTime() + timeOfDay);
}

export interface BusinessCalendar {
  /** IST weekdays with no dispatch (0 = Sunday). */
  closedWeekdays?: readonly number[];
  /** IST dates (`YYYY-MM-DD`) with no dispatch, e.g. Diwali, Chhath. */
  holidays?: readonly IstDate[];
}

/** TODO(client): confirm working days; we assume Monday–Saturday dispatch from Bhagalpur. */
export const DEFAULT_CLOSED_WEEKDAYS: readonly number[] = [0];

export function isIstBusinessDay(input: DateInput, calendar: BusinessCalendar = {}): boolean {
  const closed = calendar.closedWeekdays ?? DEFAULT_CLOSED_WEEKDAYS;
  if (closed.includes(istParts(input).weekday)) return false;
  return !(calendar.holidays ?? []).includes(istDate(input));
}

/** Moves forward `days` business days (skipping closed weekdays and holidays). */
export function addIstBusinessDays(
  input: DateInput,
  days: number,
  calendar: BusinessCalendar = {},
): Date {
  if (!Number.isInteger(days) || days < 0) {
    throw new RangeError(`Business days must be a non-negative integer, got ${days}`);
  }
  let date = toDate(input);
  let remaining = days;
  while (remaining > 0) {
    date = addDays(date, 1);
    if (isIstBusinessDay(date, calendar)) remaining -= 1;
  }
  return date;
}
