/**
 * Indian states and union territories with their GST state codes (the first two digits of a
 * GSTIN). Used for address dropdowns and for place-of-supply (CGST+SGST vs IGST).
 */

export interface IndianState {
  /** Two-digit GST state code. */
  code: string;
  name: string;
  kind: "state" | "union_territory";
}

export const INDIAN_STATES: readonly IndianState[] = [
  { code: "01", name: "Jammu and Kashmir", kind: "union_territory" },
  { code: "02", name: "Himachal Pradesh", kind: "state" },
  { code: "03", name: "Punjab", kind: "state" },
  { code: "04", name: "Chandigarh", kind: "union_territory" },
  { code: "05", name: "Uttarakhand", kind: "state" },
  { code: "06", name: "Haryana", kind: "state" },
  { code: "07", name: "Delhi", kind: "union_territory" },
  { code: "08", name: "Rajasthan", kind: "state" },
  { code: "09", name: "Uttar Pradesh", kind: "state" },
  { code: "10", name: "Bihar", kind: "state" },
  { code: "11", name: "Sikkim", kind: "state" },
  { code: "12", name: "Arunachal Pradesh", kind: "state" },
  { code: "13", name: "Nagaland", kind: "state" },
  { code: "14", name: "Manipur", kind: "state" },
  { code: "15", name: "Mizoram", kind: "state" },
  { code: "16", name: "Tripura", kind: "state" },
  { code: "17", name: "Meghalaya", kind: "state" },
  { code: "18", name: "Assam", kind: "state" },
  { code: "19", name: "West Bengal", kind: "state" },
  { code: "20", name: "Jharkhand", kind: "state" },
  { code: "21", name: "Odisha", kind: "state" },
  { code: "22", name: "Chhattisgarh", kind: "state" },
  { code: "23", name: "Madhya Pradesh", kind: "state" },
  { code: "24", name: "Gujarat", kind: "state" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu", kind: "union_territory" },
  { code: "27", name: "Maharashtra", kind: "state" },
  { code: "29", name: "Karnataka", kind: "state" },
  { code: "30", name: "Goa", kind: "state" },
  { code: "31", name: "Lakshadweep", kind: "union_territory" },
  { code: "32", name: "Kerala", kind: "state" },
  { code: "33", name: "Tamil Nadu", kind: "state" },
  { code: "34", name: "Puducherry", kind: "union_territory" },
  { code: "35", name: "Andaman and Nicobar Islands", kind: "union_territory" },
  { code: "36", name: "Telangana", kind: "state" },
  { code: "37", name: "Andhra Pradesh", kind: "state" },
  { code: "38", name: "Ladakh", kind: "union_territory" },
];

/**
 * Codes that can still appear in GSTINs but are not shipping destinations: 25 (Daman and Diu,
 * merged into 26 in 2020), 28 (Andhra Pradesh before the 2014 split), 97 (Other Territory),
 * 99 (Centre Jurisdiction).
 */
export const NON_DESTINATION_GST_STATE_CODES: readonly string[] = ["25", "28", "97", "99"];

/** Bahram Silks ships from Bhagalpur, Bihar. */
export const SELLER_GST_STATE_CODE = "10";

const byCode = new Map(INDIAN_STATES.map((s) => [s.code, s]));
const byName = new Map(INDIAN_STATES.map((s) => [s.name.toLowerCase(), s]));

export function stateByCode(code: string): IndianState | undefined {
  return byCode.get(code.trim().padStart(2, "0"));
}

export function stateByName(name: string): IndianState | undefined {
  return byName.get(name.trim().replace(/\s+/g, " ").toLowerCase());
}

export function isIndianStateName(name: string): boolean {
  return stateByName(name) !== undefined;
}

/** Valid as the first two digits of a GSTIN. */
export function isValidGstStateCode(code: string): boolean {
  return byCode.has(code) || NON_DESTINATION_GST_STATE_CODES.includes(code);
}
