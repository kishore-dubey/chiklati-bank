import type { FastifyInstance } from "fastify";
import { internalAuthGuard } from "../../lib/auth/internal-auth.js";
import { postAchClear, postAchTransmit, postCardPurchase, postWireTransmit } from "./sandbox.controller.js";

export async function sandboxRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { id: string } }>(
    "/sandbox/payments/:id/ach/transmit",
    { preHandler: [internalAuthGuard] },
    postAchTransmit,
  );

  app.post<{ Params: { id: string } }>(
    "/sandbox/payments/:id/ach/clear",
    { preHandler: [internalAuthGuard] },
    postAchClear,
  );

  app.post<{ Params: { id: string } }>(
    "/sandbox/payments/:id/wire/transmit",
    { preHandler: [internalAuthGuard] },
    postWireTransmit,
  );

  app.post<{ Params: { id: string } }>(
    "/sandbox/cards/:id/purchase",
    { preHandler: [internalAuthGuard] },
    postCardPurchase,
  );
}
