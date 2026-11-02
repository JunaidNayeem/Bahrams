import { z } from "zod";
import { isValidGstin, normaliseGstin } from "../tax/gstin";

/** Indian PIN codes are six digits and never start with 0. */
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

export const pincodeSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, ""))
  .pipe(z.string().regex(PINCODE_PATTERN, "Enter a valid 6-digit PIN code."));

/**
 * Accepts "98765 43210", "+91 98765-43210", "919876543210" or "09876543210" and returns E.164
 * ("+919876543210"); null if it is not an Indian mobile number (10 digits starting 6–9).
 */
export function normaliseIndianMobile(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

export const indianMobileSchema = z
  .string()
  .trim()
  .refine((value) => normaliseIndianMobile(value) !== null, "Enter a valid 10-digit mobile number.")
  .transform((value) => normaliseIndianMobile(value) ?? value);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email address is too long.")
  .pipe(z.email("Enter a valid email address."));

export const gstinSchema = z
  .string()
  .transform(normaliseGstin)
  .refine(isValidGstin, "Enter a valid 15-character GSTIN.");

export const personNameSchema = z
  .string()
  .trim()
  .min(2, "Enter your name.")
  .max(100, "Name must be 100 characters or fewer.");

/** Trimmed free text where an empty field means "not given". */
export function optionalText(max: number) {
  return optionalField(z.string().max(max, `Keep this to ${max} characters or fewer.`));
}

/**
 * Wraps a string schema so an empty or whitespace-only form field becomes undefined instead of
 * failing validation, while a filled-in value is still fully validated.
 */
export function optionalField<Out>(schema: z.ZodType<Out, string>) {
  return z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .pipe(schema.optional())
    .optional();
}
