import { z } from "zod";
import { isIndianStateName, stateByName } from "../tax/states";
import { indianMobileSchema, optionalText, personNameSchema, pincodeSchema } from "./primitives";

export const addressSchema = z.object({
  name: personNameSchema,
  phone: indianMobileSchema,
  line1: z
    .string()
    .trim()
    .min(3, "Enter your house or flat number and street.")
    .max(200, "Keep this to 200 characters or fewer."),
  line2: optionalText(200),
  landmark: optionalText(120),
  city: z
    .string()
    .trim()
    .min(2, "Enter your town or city.")
    .max(100, "Keep this to 100 characters or fewer."),
  /** Stored as the canonical state name so it maps to a GST state code. */
  state: z
    .string()
    .trim()
    .refine(isIndianStateName, "Choose your state.")
    .transform((value) => stateByName(value)?.name ?? value),
  pincode: pincodeSchema,
});

export type AddressFormValues = z.input<typeof addressSchema>;
export type Address = z.output<typeof addressSchema>;
