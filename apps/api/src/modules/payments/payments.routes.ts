import type { FastifyInstance } from "fastify";
import { internalAuthGuard } from "../../lib/auth/internal-auth.js";
import { createIdempotencyHooks } from "../../lib/idempotency/idempotency.js";
import { getPayment, getPayments, postPayment } from "./payments.controller.js";

const idempotency = createIdempotencyHooks("payments");

export async function paymentsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/payments",
    {
      preHandler: [internalAuthGuard, idempotency.preHandler],
      onSend: idempotency.onSend,
      onError: idempotency.onError,
    },
    postPayment,
  );

  app.get<{ Querystring: { accountId?: string } }>(
    "/payments",
    { preHandler: [internalAuthGuard] },
    getPayments,
  );

  app.get<{ Params: { id: string } }>("/payments/:id", { preHandler: [internalAuthGuard] }, getPayment);
}
