import { z } from "zod";
import { addressSchema, fullNameSchema, phoneSchema } from "../applications/common.schema.js";

// Required only when the account belongs to a Business customer -- Unit
// needs a named human cardholder since the business entity itself has no
// personal attributes. Individual customers need none of this; their
// existing Customer record already carries this identity.
export const cardholderSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema,
  email: z.email(),
  dateOfBirth: z.string(),
  address: addressSchema,
});

export const createCardInputSchema = z.object({
  accountId: z.uuid(),
  cardholder: cardholderSchema.optional(),
});

export type Cardholder = z.infer<typeof cardholderSchema>;
export type CreateCardInput = z.infer<typeof createCardInputSchema>;
