import { z } from "zod";
import { PRODUCT_KINDS } from "../enums";
import { isValidOrderNumber, normaliseOrderNumber } from "../numbering";
import {
  emailSchema,
  gstinSchema,
  indianMobileSchema,
  optionalField,
  optionalText,
  personNameSchema,
} from "./primitives";

const orderNumberSchema = z
  .string()
  .transform(normaliseOrderNumber)
  .refine(
    isValidOrderNumber,
    "Enter the order number from your confirmation, e.g. BS-2627-000123.",
  );

export const reviewInputSchema = z.object({
  productId: z.uuid(),
  rating: z
    .number("Choose a rating.")
    .int()
    .min(1, "Choose a rating from 1 to 5.")
    .max(5, "Choose a rating from 1 to 5."),
  title: optionalText(120),
  body: z
    .string()
    .trim()
    .min(20, "Tell us a little more: at least 20 characters.")
    .max(2000, "Keep your review to 2,000 characters or fewer."),
  displayName: personNameSchema,
  /** Storage object paths of uploaded photos. */
  photoPaths: z.array(z.string().min(1).max(300)).max(5, "Add up to 5 photos.").default([]),
});

export const BULK_BUYER_TYPES = [
  "boutique",
  "tailor",
  "designer",
  "retailer",
  "home_decor",
  "corporate_gifting",
  "other",
] as const;

export const bulkEnquirySchema = z.object({
  name: personNameSchema,
  businessName: optionalText(200),
  email: emailSchema,
  phone: indianMobileSchema,
  gstin: optionalField(gstinSchema),
  city: z.string().trim().min(2, "Enter your town or city.").max(100),
  buyerType: z.enum(BULK_BUYER_TYPES, "Tell us what kind of buyer you are."),
  interests: z.array(z.enum(PRODUCT_KINDS)).min(1, "Choose at least one product type."),
  quantityNote: optionalText(200),
  message: z
    .string()
    .trim()
    .min(10, "Tell us what you are looking for.")
    .max(2000, "Keep this to 2,000 characters or fewer."),
});

export const GRIEVANCE_CATEGORIES = [
  "order_or_delivery",
  "payment_or_refund",
  "return_or_exchange",
  "product_quality",
  "authenticity",
  "privacy",
  "other",
] as const;

export const grievanceSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  phone: optionalField(indianMobileSchema),
  orderNumber: optionalField(orderNumberSchema),
  category: z.enum(GRIEVANCE_CATEGORIES, "Choose what your complaint is about."),
  description: z
    .string()
    .trim()
    .min(20, "Describe the problem in at least 20 characters.")
    .max(5000, "Keep this to 5,000 characters or fewer."),
});

/** DPDP data-principal rights we handle through /account/privacy and the grievance page. */
export const DATA_REQUEST_TYPES = ["access", "correction", "erasure", "nomination"] as const;

export const dataRequestSchema = z
  .object({
    type: z.enum(DATA_REQUEST_TYPES, "Choose the type of request."),
    email: emailSchema,
    details: optionalText(2000),
  })
  .superRefine((value, ctx) => {
    if ((value.type === "correction" || value.type === "nomination") && !value.details) {
      ctx.addIssue({
        code: "custom",
        path: ["details"],
        message:
          value.type === "correction"
            ? "Tell us which details are wrong and what they should be."
            : "Give the name and contact details of the person you are nominating.",
      });
    }
  });

export type ReviewInput = z.output<typeof reviewInputSchema>;
export type BulkEnquiryInput = z.output<typeof bulkEnquirySchema>;
export type GrievanceInput = z.output<typeof grievanceSchema>;
export type DataRequestInput = z.output<typeof dataRequestSchema>;
export type BulkBuyerType = (typeof BULK_BUYER_TYPES)[number];
export type GrievanceCategory = (typeof GRIEVANCE_CATEGORIES)[number];
export type DataRequestType = (typeof DATA_REQUEST_TYPES)[number];
