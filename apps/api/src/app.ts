import Fastify, { type FastifyInstance } from "fastify";
import { loggerOptions } from "./lib/logger.js";
import { env } from "./config/env.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { applicationsRoutes } from "./modules/applications/applications.routes.js";
import { webhooksRoutes } from "./modules/webhooks/webhooks.routes.js";
import { customersRoutes } from "./modules/customers/customers.routes.js";
import { accountsRoutes } from "./modules/accounts/accounts.routes.js";
import { counterpartiesRoutes } from "./modules/counterparties/counterparties.routes.js";
import { paymentsRoutes } from "./modules/payments/payments.routes.js";
import { cardsRoutes } from "./modules/cards/cards.routes.js";
import { sandboxRoutes } from "./modules/sandbox/sandbox.routes.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: loggerOptions });

  app.register(healthRoutes);
  app.register(applicationsRoutes);
  app.register(webhooksRoutes);
  app.register(customersRoutes);
  app.register(accountsRoutes);
  app.register(counterpartiesRoutes);
  app.register(paymentsRoutes);
  app.register(cardsRoutes);

  // Wraps Unit's own /sandbox/* simulation endpoints -- meaningless outside
  // Unit's sandbox environment. Gated by its own flag (not NODE_ENV) so a
  // deployed container can run NODE_ENV=production while still opting in.
  if (env.ENABLE_SANDBOX_ROUTES) {
    app.register(sandboxRoutes);
  }

  return app;
}
