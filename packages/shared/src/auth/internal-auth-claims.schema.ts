import { z } from "zod";

export const internalAuthClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
});

export type InternalAuthClaims = z.infer<typeof internalAuthClaimsSchema>;
