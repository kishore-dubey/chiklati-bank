import type { FastifyInstance } from "fastify";
import { internalAuthGuard } from "../../lib/auth/internal-auth.js";
import { createIdempotencyHooks } from "../../lib/idempotency/idempotency.js";
import { getApplication, postApplication } from "./applications.controller.js";

const idempotency = createIdempotencyHooks("applications");

export async function applicationsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/applications",
    {
      preHandler: [internalAuthGuard, idempotency.preHandler],
      onSend: idempotency.onSend,
      onError: idempotency.onError,
    },
    postApplication,
  );

  app.get<{ Params: { id: string } }>(
    "/applications/:id",
    {
      preHandler: [internalAuthGuard],
    },
    getApplication,
  );
}
