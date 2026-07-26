import { z } from "zod";

export const fullNameSchema = z.object({
  first: z.string().min(1),
  last: z.string().min(1),
});

export const phoneSchema = z.object({
  countryCode: z.string().min(1),
  number: z.string().min(1),
});

export const addressSchema = z.object({
  street: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2).default("US"),
});

export type FullName = z.infer<typeof fullNameSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type Address = z.infer<typeof addressSchema>;
