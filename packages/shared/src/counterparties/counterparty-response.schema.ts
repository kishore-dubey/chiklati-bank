import { z } from "zod";
import {
  counterpartyAccountTypeSchema,
  counterpartyPermissionsSchema,
  counterpartyTypeSchema,
} from "./create-counterparty.schema.js";

export const counterpartyResponseSchema = z.object({
  id: z.string(),
  unitCounterpartyId: z.string(),
  customerId: z.string(),
  name: z.string(),
  routingNumber: z.string(),
  accountNumber: z.string(),
  accountType: counterpartyAccountTypeSchema,
  type: counterpartyTypeSchema,
  permissions: counterpartyPermissionsSchema.nullable(),
  createdAt: z.string(),
});

export type CounterpartyResponse = z.infer<typeof counterpartyResponseSchema>;
