import { z } from "zod";

export const paymentRailSchema = z.enum(["Book", "Ach", "Wire"]);
export const paymentDirectionSchema = z.enum(["Credit", "Debit"]);
export const paymentStatusSchema = z.enum([
  "Pending",
  "PendingReview",
  "Clearing",
  "Sent",
  "Rejected",
  "Canceled",
]);

export const paymentResponseSchema = z.object({
  id: z.string(),
  unitPaymentId: z.string(),
  rail: paymentRailSchema,
  accountId: z.string(),
  direction: paymentDirectionSchema,
  amount: z.string(),
  status: paymentStatusSchema,
  description: z.string(),
  counterpartyId: z.string().nullable(),
  counterpartySnapshot: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PaymentRail = z.infer<typeof paymentRailSchema>;
export type PaymentDirection = z.infer<typeof paymentDirectionSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
