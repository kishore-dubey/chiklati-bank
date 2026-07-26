import { z } from "zod";
import { addressSchema, fullNameSchema, phoneSchema } from "./common.schema.js";

export const businessEntityTypeSchema = z.enum([
  "LLC",
  "Partnership",
  "PubliclyTradedCorporation",
  "PrivatelyHeldCorporation",
  "NotForProfitOrganization",
]);

const businessOfficerSchema = z.object({
  fullName: fullNameSchema,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateOfBirth must be YYYY-MM-DD"),
  title: z.string().min(1),
  ssn: z
    .string()
    .regex(/^\d{9}$/, "SSN must be 9 digits")
    .optional(),
  email: z.email(),
  phone: phoneSchema,
  address: addressSchema,
  occupation: z.string().min(1),
});

const beneficialOwnerSchema = businessOfficerSchema
  .omit({ title: true })
  .extend({
    percentage: z.number().int().min(25).max(100),
  });

export const businessApplicationInputSchema = z.object({
  type: z.literal("business"),
  name: z.string().min(1),
  ein: z
    .string()
    .regex(/^\d{9}$/, "EIN must be 9 digits")
    .optional(),
  entityType: businessEntityTypeSchema,
  stateOfIncorporation: z.string().length(2),
  yearOfIncorporation: z.string().regex(/^\d{4}$/, "yearOfIncorporation must be YYYY"),
  address: addressSchema,
  phone: phoneSchema,
  contact: z.object({
    fullName: fullNameSchema,
    email: z.email(),
    phone: phoneSchema,
  }),
  officer: businessOfficerSchema,
  beneficialOwners: z.array(beneficialOwnerSchema).default([]),
  attestedNoBeneficialOwners: z.boolean().default(false),
});

export type BusinessApplicationInput = z.infer<typeof businessApplicationInputSchema>;
