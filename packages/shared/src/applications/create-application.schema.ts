import { z } from "zod";
import { individualApplicationInputSchema } from "./individual-application.schema.js";
import { businessApplicationInputSchema } from "./business-application.schema.js";

export const createApplicationInputSchema = z.discriminatedUnion("type", [
  individualApplicationInputSchema,
  businessApplicationInputSchema,
]);

export type CreateApplicationInput = z.infer<typeof createApplicationInputSchema>;
