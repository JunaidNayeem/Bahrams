import { absoluteUrl } from "@/config/routes";

/**
 * Integer paise to a schema.org price string in rupees ("349900" -> "3499.00").
 * Integer arithmetic only, so no float rounding can creep into structured data.
 */
export function paiseToSchemaPrice(paise: number): string {
  if (!Number.isSafeInteger(paise) || paise < 0) {
    throw new RangeError(`Price must be a non-negative integer number of paise, got ${paise}`);
  }
  const rupees = Math.floor(paise / 100);
  const remainder = paise % 100;
  return `${rupees}.${remainder.toString().padStart(2, "0")}`;
}

/** Drops keys whose value is undefined, so optional properties are omitted rather than null. */
export function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

export function absoluteUrls(paths: readonly string[] | undefined): string[] {
  return (paths ?? []).map(absoluteUrl);
}

/**
 * siteConfig carries placeholder phone numbers (all zeros) until the client confirms them;
 * publishing those in structured data would be worse than omitting the field.
 */
export function publishablePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "").replace(/^91/, "");
  return /^0*$/.test(digits) ? undefined : phone;
}
