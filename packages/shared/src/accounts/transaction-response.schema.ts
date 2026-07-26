import { z } from "zod";

export const transactionDirectionSchema = z.enum(["Credit", "Debit"]);

export const transactionResponseSchema = z.object({
  id: z.string(),
  unitTransactionId: z.string(),
  accountId: z.string(),
  type: z.string(),
  direction: transactionDirectionSchema,
  amount: z.string(),
  balance: z.string(),
  summary: z.string(),
  unitCreatedAt: z.string(),
  createdAt: z.string(),
});

export type TransactionDirection = z.infer<typeof transactionDirectionSchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
