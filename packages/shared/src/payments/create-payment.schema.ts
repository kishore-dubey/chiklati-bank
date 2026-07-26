import { z } from "zod";
import { addressSchema } from "../applications/common.schema.js";

const amountSchema = z.string().regex(/^\d+$/, "amount must be a non-negative integer string (cents)");

export const bookPaymentInputSchema = z.object({
  rail: z.literal("book"),
  accountId: z.uuid(),
  counterpartyAccountId: z.uuid(),
  amount: amountSchema,
  description: z.string().min(1).max(80),
});

export const achPaymentInputSchema = z.object({
  rail: z.literal("ach"),
  accountId: z.uuid(),
  counterpartyId: z.uuid(),
  amount: amountSchema,
  direction: z.enum(["Credit", "Debit"]),
  description: z.string().min(1).max(80),
  addenda: z.string().optional(),
  sameDay: z.boolean().default(false),
});

export const wirePaymentInputSchema = z.object({
  rail: z.literal("wire"),
  accountId: z.uuid(),
  amount: amountSchema,
  description: z.string().min(1).max(80),
  counterparty: z.object({
    name: z.string().min(1),
    routingNumber: z.string().regex(/^\d{9}$/, "Routing number must be 9 digits"),
    accountNumber: z.string().min(1),
    address: addressSchema,
  }),
});

export const createPaymentInputSchema = z.discriminatedUnion("rail", [
  bookPaymentInputSchema,
  achPaymentInputSchema,
  wirePaymentInputSchema,
]);

export type BookPaymentInput = z.infer<typeof bookPaymentInputSchema>;
export type AchPaymentInput = z.infer<typeof achPaymentInputSchema>;
export type WirePaymentInput = z.infer<typeof wirePaymentInputSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;
