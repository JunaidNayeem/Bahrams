/** INR formatting for integer paise. Pure, so it is shared by server and client components. */

const wholeRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const withPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function assertPaise(paise: number): void {
  if (!Number.isSafeInteger(paise)) {
    throw new TypeError(`Money must be an integer number of paise, got ${paise}`);
  }
}

/**
 * "₹1,23,456" with Indian digit grouping. Paise are shown only when non-zero ("₹1,450.50"),
 * because almost every catalogue price is a whole number of rupees.
 */
export function formatPaise(paise: number): string {
  assertPaise(paise);
  const formatter = paise % 100 === 0 ? wholeRupees : withPaise;
  return formatter.format(paise / 100);
}

/** Decimal rupee string for machine-readable markup (`<data value>`, JSON-LD offers). */
export function paiseToRupeeString(paise: number): string {
  assertPaise(paise);
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
