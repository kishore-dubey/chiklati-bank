import type { FastifyInstance } from "fastify";
import { internalAuthGuard } from "../../lib/auth/internal-auth.js";
import { createIdempotencyHooks } from "../../lib/idempotency/idempotency.js";
import {
  getCounterparties,
  getCounterparty,
  postCounterparty,
} from "./counterparties.controller.js";

const idempotency = createIdempotencyHooks("counterparties");

export async function counterpartiesRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/counterparties",
    {
      preHandler: [internalAuthGuard, idempotency.preHandler],
      onSend: idempotency.onSend,
      onError: idempotency.onError,
    },
    postCounterparty,
  );

  app.get<{ Querystring: { customerId?: string } }>(
    "/counterparties",
    { preHandler: [internalAuthGuard] },
    getCounterparties,
  );

  app.get<{ Params: { id: string } }>(
    "/counterparties/:id",
    { preHandler: [internalAuthGuard] },
    getCounterparty,
  );
}
