import { z } from "zod";

export const counterpartyAccountTypeSchema = z.enum(["Checking", "Savings", "Loan"]);
export const counterpartyTypeSchema = z.enum(["Business", "Person", "Unknown"]);
export const counterpartyPermissionsSchema = z.enum(["CreditOnly", "DebitOnly", "CreditAndDebit"]);

export const createCounterpartyInputSchema = z.object({
  customerId: z.uuid(),
  name: z.string().min(1).max(50),
  routingNumber: z.string().regex(/^\d{9}$/, "Routing number must be 9 digits"),
  accountNumber: z.string().min(1),
  accountType: counterpartyAccountTypeSchema.default("Checking"),
  type: counterpartyTypeSchema.default("Person"),
  permissions: counterpartyPermissionsSchema.optional(),
});

export type CreateCounterpartyInput = z.infer<typeof createCounterpartyInputSchema>;
