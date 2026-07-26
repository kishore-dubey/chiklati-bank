import type { FastifyInstance } from "fastify";
import { internalAuthGuard } from "../../lib/auth/internal-auth.js";
import { createIdempotencyHooks } from "../../lib/idempotency/idempotency.js";
import { getAccount, getAccounts, getAccountTransactions, postAccount } from "./accounts.controller.js";

const idempotency = createIdempotencyHooks("accounts");

export async function accountsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/accounts",
    {
      preHandler: [internalAuthGuard, idempotency.preHandler],
      onSend: idempotency.onSend,
      onError: idempotency.onError,
    },
    postAccount,
  );

  app.get<{ Querystring: { customerId?: string } }>(
    "/accounts",
    { preHandler: [internalAuthGuard] },
    getAccounts,
  );

  app.get<{ Params: { id: string } }>("/accounts/:id", { preHandler: [internalAuthGuard] }, getAccount);

  app.get<{ Params: { id: string } }>(
    "/accounts/:id/transactions",
    { preHandler: [internalAuthGuard] },
    getAccountTransactions,
  );
}
