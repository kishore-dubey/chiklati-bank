import { z } from "zod";

export const createAccountInputSchema = z.object({
  customerId: z.uuid(),
});

export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;
