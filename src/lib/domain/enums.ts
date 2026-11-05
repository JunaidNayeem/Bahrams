/**
 * Single source of truth for enumerations shared by the database, domain logic,
 * storefront and admin. Postgres enums in supabase/migrations MUST mirror these
 * values exactly (same spelling, same order). Change both together.
 */

/** What kind of thing a product is; drives page template, unit and HSN defaults. */
export const PRODUCT_KINDS = [
  "saree",
  "fabric", // sold per metre
  "stole_dupatta",
  "dress_material",
  "kurta_fabric",
  "home_furnishing",
] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

/**
 * Primary fibre / yarn, also used for warp and weft. Leads navigation (tussar and matka first).
 * Values from "silk" on were added in migration 20261105000001 (appended, so the order still
 * mirrors Postgres). Grouping and display order for forms live in claims/fibres.ts.
 */
export const FIBRES = [
  "tussar",
  "ghicha",
  "matka",
  "raw_silk",
  "mulberry",
  "eri",
  "noil",
  "cotton_silk",
  "linen",
  "cotton",
  "blend",
  "silk",
  "desi_tussar",
  "handspun_tussar",
  "munga",
  "katia",
  "dupion",
  "spun_silk",
  "throwster",
  "silk_blend",
  "modal_silk",
  "kota",
  "organic_linen",
  "mercerised_cotton",
  "khadi",
  "viscose",
  "handspun_viscose",
  "modal",
  "polyester",
  "staple",
  "rollex",
  "zari",
  "handspun_yarn",
  "slub",
] as const;
export type Fibre = (typeof FIBRES)[number];

export const OCCASIONS = ["office", "festive", "wedding", "puja", "gifting"] as const;
export type Occasion = (typeof OCCASIONS)[number];

/** Unit a variant is sold in. Fabric is priced per metre, bought in 0.5 m steps. */
export const SELL_UNITS = ["piece", "metre"] as const;
export type SellUnit = (typeof SELL_UNITS)[number];

export const PUBLISH_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

/**
 * Order lifecycle: 12 states managed in the admin (kickoff doc, "Orders").
 * Allowed transitions live in src/lib/domain/orders/state-machine.ts.
 */
export const ORDER_STATUSES = [
  "pending_payment", // prepaid order created, awaiting gateway capture
  "awaiting_cod_confirmation", // COD order held until WhatsApp/phone confirmation
  "confirmed", // paid or COD confirmed; stock committed
  "packed",
  "shipped",
  "out_for_delivery",
  "delivery_failed", // NDR raised; reattempt before RTO
  "delivered",
  "rto", // returned to origin after failed delivery; QC before restock
  "return_requested",
  "returned", // reverse pickup received and quality-checked
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["upi", "card", "netbanking", "wallet", "emi", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "captured",
  "failed",
  "refund_pending",
  "refunded",
  "partially_refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const RESERVATION_STATUSES = ["active", "committed", "released", "expired"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const STOCK_LOCATION_TYPES = ["shop", "warehouse", "with_weaver"] as const;
export type StockLocationType = (typeof STOCK_LOCATION_TYPES)[number];

export const STOCK_ADJUSTMENT_REASONS = [
  "received",
  "sold",
  "returned_restock",
  "damaged_write_off",
  "audit_correction",
  "transfer",
  "photoshoot",
] as const;
export type StockAdjustmentReason = (typeof STOCK_ADJUSTMENT_REASONS)[number];

export const RETURN_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "pickup_scheduled",
  "received",
  "qc_passed",
  "qc_failed",
  "refunded",
  "store_credit_issued",
  "exchanged",
] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_RESOLUTIONS = ["exchange", "store_credit", "refund_to_source"] as const;
export type ReturnResolution = (typeof RETURN_RESOLUTIONS)[number];

/** Staff roles from the kickoff doc (Settings and roles). Shoppers have no staff role. */
export const STAFF_ROLES = [
  "owner",
  "manager",
  "catalogue_editor",
  "fulfilment",
  "support",
  "accountant",
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const COUPON_TYPES = ["percentage", "flat", "free_shipping"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** DPDP: each purpose is consented to separately; marketing is always opt-in. */
export const CONSENT_PURPOSES = [
  "order_processing",
  "marketing_email",
  "marketing_whatsapp",
  "marketing_sms",
  "analytics",
] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const GRIEVANCE_STATUSES = ["received", "acknowledged", "in_progress", "resolved"] as const;
export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number];
