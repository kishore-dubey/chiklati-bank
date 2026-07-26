import { z } from "zod";
import { addressSchema, fullNameSchema, phoneSchema } from "./common.schema.js";

export const individualApplicationInputSchema = z.object({
  type: z.literal("individual"),
  ssn: z
    .string()
    .regex(/^\d{9}$/, "SSN must be 9 digits")
    .optional(),
  fullName: fullNameSchema,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateOfBirth must be YYYY-MM-DD"),
  address: addressSchema,
  phone: phoneSchema,
  email: z.email(),
  occupation: z.string().min(1),
});

export type IndividualApplicationInput = z.infer<typeof individualApplicationInputSchema>;
