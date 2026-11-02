import { istMidnight, istParts, type DateInput } from "./time";

/**
 * Document numbers. Indian financial years run 1 April – 31 March (IST). GST invoice and credit
 * note numbers must be unique within a financial year and at most 16 characters, so every
 * series embeds the FY and the database keeps one counter per series per FY.
 */

export interface FinancialYear {
  /** Calendar year in which the FY starts, e.g. 2026 for 2026-27. */
  startYear: number;
  /** "2026-27" */
  label: string;
  /** "2627", used inside document numbers. */
  code: string;
  /** 1 April 00:00 IST. */
  startsAt: Date;
  /** 1 April 00:00 IST of the next year (exclusive end). */
  endsBefore: Date;
}

export function financialYearOf(input: DateInput): FinancialYear {
  const { year, month } = istParts(input);
  return financialYearStarting(month >= 4 ? year : year - 1);
}

export function financialYearStarting(startYear: number): FinancialYear {
  const endTwoDigits = String((startYear + 1) % 100).padStart(2, "0");
  return {
    startYear,
    label: `${startYear}-${endTwoDigits}`,
    code: `${String(startYear % 100).padStart(2, "0")}${endTwoDigits}`,
    startsAt: istMidnight(startYear, 4, 1),
    endsBefore: istMidnight(startYear + 1, 4, 1),
  };
}

export const ORDER_NUMBER_PREFIX = "BS";
export const INVOICE_NUMBER_PREFIX = "BSI";
export const CREDIT_NOTE_NUMBER_PREFIX = "BSC";
const SEQUENCE_DIGITS = 6;
const MAX_SEQUENCE = 10 ** SEQUENCE_DIGITS - 1;

function sequencePart(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > MAX_SEQUENCE) {
    throw new RangeError(`Sequence must be 1–${MAX_SEQUENCE}, got ${sequence}`);
  }
  return String(sequence).padStart(SEQUENCE_DIGITS, "0");
}

/** "BS-2627-000123": what customers see in emails, tracking and support chats. */
export function formatOrderNumber(sequence: number, placedAt: DateInput): string {
  return `${ORDER_NUMBER_PREFIX}-${financialYearOf(placedAt).code}-${sequencePart(sequence)}`;
}

/** "BSI/2627/000123" (15 characters, within the GST 16-character limit). */
export function formatInvoiceNumber(sequence: number, issuedAt: DateInput): string {
  return `${INVOICE_NUMBER_PREFIX}/${financialYearOf(issuedAt).code}/${sequencePart(sequence)}`;
}

/** "BSC/2627/000012" for returns and post-invoice cancellations. */
export function formatCreditNoteNumber(sequence: number, issuedAt: DateInput): string {
  return `${CREDIT_NOTE_NUMBER_PREFIX}/${financialYearOf(issuedAt).code}/${sequencePart(sequence)}`;
}

export const ORDER_NUMBER_PATTERN = /^BS-(\d{2})(\d{2})-(\d{6})$/;

export function normaliseOrderNumber(input: string): string {
  return input.trim().toUpperCase().replace(/^#/, "");
}

export function parseOrderNumber(
  input: string,
): { financialYearCode: string; sequence: number } | null {
  const match = ORDER_NUMBER_PATTERN.exec(normaliseOrderNumber(input));
  if (!match) return null;
  const [, start, end, seq] = match;
  if ((Number(start) + 1) % 100 !== Number(end)) return null;
  const sequence = Number(seq);
  if (sequence < 1) return null;
  return { financialYearCode: `${start}${end}`, sequence };
}

export function isValidOrderNumber(input: string): boolean {
  return parseOrderNumber(input) !== null;
}
