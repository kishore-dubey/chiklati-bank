import { z } from "zod";

export const accountStatusSchema = z.enum(["Open", "Frozen", "Closed"]);

export const accountResponseSchema = z.object({
  id: z.string(),
  unitAccountId: z.string(),
  customerId: z.string(),
  depositProduct: z.string(),
  status: accountStatusSchema,
  currency: z.string(),
  balance: z.string(),
  hold: z.string(),
  available: z.string(),
  routingNumber: z.string(),
  accountNumber: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type AccountResponse = z.infer<typeof accountResponseSchema>;
