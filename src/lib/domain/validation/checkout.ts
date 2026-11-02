import { z } from "zod";
import { PAYMENT_METHODS } from "../enums";
import { addressSchema } from "./address";
import {
  emailSchema,
  gstinSchema,
  indianMobileSchema,
  optionalField,
  optionalText,
} from "./primitives";

export const GIFT_MESSAGE_MAX_LENGTH = 250;

export const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,40}$/, "Enter a valid coupon code.");

export const checkoutInputSchema = z
  .object({
    email: emailSchema,
    phone: indianMobileSchema,
    shippingAddress: addressSchema,
    billingSameAsShipping: z.boolean().default(true),
    billingAddress: addressSchema.optional(),
    /** Optional B2B GSTIN for an input-tax-credit invoice. */
    gstin: optionalField(gstinSchema),
    businessName: optionalText(200),
    paymentMethod: z.enum(PAYMENT_METHODS, "Choose a payment method."),
    couponCode: optionalField(couponCodeSchema),
    giftWrap: z.boolean().default(false),
    giftMessage: optionalText(GIFT_MESSAGE_MAX_LENGTH),
    /** Every marketing box starts unticked (DPDP; Dark Patterns Guidelines). */
    marketingConsent: z
      .object({
        marketing_email: z.boolean().default(false),
        marketing_whatsapp: z.boolean().default(false),
        marketing_sms: z.boolean().default(false),
      })
      .default({ marketing_email: false, marketing_whatsapp: false, marketing_sms: false }),
    acceptTerms: z.literal(true, {
      error: "Please accept the terms, shipping and returns policies to place your order.",
    }),
  })
  .superRefine((value, ctx) => {
    if (!value.billingSameAsShipping && !value.billingAddress) {
      ctx.addIssue({
        code: "custom",
        path: ["billingAddress"],
        message: "Enter a billing address.",
      });
    }
    if (value.gstin && !value.businessName) {
      ctx.addIssue({
        code: "custom",
        path: ["businessName"],
        message: "Enter the business name registered with this GSTIN.",
      });
    }
  });

export type CheckoutFormValues = z.input<typeof checkoutInputSchema>;
export type CheckoutInput = z.output<typeof checkoutInputSchema>;
