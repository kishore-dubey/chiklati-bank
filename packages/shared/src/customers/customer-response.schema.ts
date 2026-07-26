import { z } from "zod";

export const customerTypeSchema = z.enum(["Individual", "Business"]);
export const customerStatusSchema = z.enum(["Active", "Archived"]);

export const customerResponseSchema = z.object({
  id: z.string(),
  unitCustomerId: z.string(),
  type: customerTypeSchema,
  status: customerStatusSchema,
  createdAt: z.string(),
});

export type CustomerType = z.infer<typeof customerTypeSchema>;
export type CustomerStatus = z.infer<typeof customerStatusSchema>;
export type CustomerResponse = z.infer<typeof customerResponseSchema>;
