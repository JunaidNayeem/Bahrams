/**
 * Static brand and business facts. Values marked TODO(client) are placeholders until the
 * client answers the open questions in docs/open-questions.md. Anything staff need to edit
 * at runtime (COD limit, fees, grievance officer) lives in the `settings` table instead.
 */
export const siteConfig = {
  name: "Bahram Silks",
  tagline: "The weaving house of Bhagalpur",
  promise: "Woven in Bhagalpur. Certified pure. Sold by the hands that made it.",
  description:
    "Authentic Bhagalpur tussar, raw and matka silk sarees and fabric by the metre, sold direct from the looms of Bhagalpur.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3020",
  locale: "en-IN",
  currency: "INR",
  /** GI certificate for Bhagalpur Silk: 15 January 2013 (use 2013 in all copy). */
  giYear: 2013,
  /** TODO(client): confirm link to the "Bahram Raw Silk" listing (est. 1948) before using. */
  foundingYear: null as number | null,
  /** Registered seller. The footer and invoices read the `legal_entity` setting instead. */
  legalName: "Bahram Raw Silk",
  gstin: "10AAFFB7503A1ZF",
  /** Seller's state for GST place-of-supply (Bihar, state code 10). */
  sellerState: { name: "Bihar", gstStateCode: "10" },
  contact: {
    email: "care@bahramsilk.com",
    phone: "+91-9801616789",
    // TODO(client): confirm the WhatsApp Business number (NEXT_PUBLIC_WHATSAPP_NUMBER overrides).
    whatsapp: "910000000000",
    address: "Hossainabad, Bounsi Road, Near Jama Masjid, Bhagalpur 812005, Bihar, India",
    /** Structured parts of the address above, for JSON-LD and Google Business Profile. */
    streetAddress: "Hossainabad, Bounsi Road, Near Jama Masjid",
    postalCode: "812005",
  },
  social: {
    // TODO(client): confirm handles once registered
    instagram: "https://www.instagram.com/bahramsilks",
    facebook: "https://www.facebook.com/bahramsilks",
    youtube: "https://www.youtube.com/@bahramsilks",
    pinterest: "https://www.pinterest.com/bahramsilks",
  },
} as const;

export type SiteConfig = typeof siteConfig;
