import { isValidGstStateCode } from "./states";

/**
 * GSTIN: 2-digit state code + 10-character PAN + entity number + "Z" + check character.
 * The check character is a base-36 Luhn-style checksum over the first 14 characters.
 */
export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function normaliseGstin(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

/** Check character for the first 14 characters of a GSTIN. */
export function gstinCheckCharacter(first14: string): string {
  if (first14.length !== 14) throw new RangeError("Expected the first 14 characters of a GSTIN");
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const value = CHARSET.indexOf(first14[i]);
    if (value < 0) throw new RangeError(`Invalid GSTIN character "${first14[i]}"`);
    const product = value * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARSET[(36 - (sum % 36)) % 36];
}

export function isValidGstin(input: string): boolean {
  const gstin = normaliseGstin(input);
  if (!GSTIN_PATTERN.test(gstin)) return false;
  if (!isValidGstStateCode(gstin.slice(0, 2))) return false;
  return gstinCheckCharacter(gstin.slice(0, 14)) === gstin[14];
}

export interface ParsedGstin {
  gstin: string;
  stateCode: string;
  pan: string;
  entityNumber: string;
}

export function parseGstin(input: string): ParsedGstin | null {
  const gstin = normaliseGstin(input);
  if (!isValidGstin(gstin)) return null;
  return {
    gstin,
    stateCode: gstin.slice(0, 2),
    pan: gstin.slice(2, 12),
    entityNumber: gstin[12],
  };
}
