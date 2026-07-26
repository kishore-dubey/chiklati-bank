import { z } from "zod";

export const cardTypeSchema = z.enum(["IndividualVirtual", "BusinessVirtual"]);
export const cardStatusSchema = z.enum([
  "Active",
  "Inactive",
  "Frozen",
  "ClosedByCustomer",
  "Stolen",
  "Lost",
  "SuspectedFraud",
]);

export const cardResponseSchema = z.object({
  id: z.string(),
  unitCardId: z.string(),
  accountId: z.string(),
  type: cardTypeSchema,
  status: cardStatusSchema,
  last4Digits: z.string(),
  expirationDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CardType = z.infer<typeof cardTypeSchema>;
export type CardStatus = z.infer<typeof cardStatusSchema>;
export type CardResponse = z.infer<typeof cardResponseSchema>;
