import Fastify, { type FastifyInstance } from "fastify";
import { loggerOptions } from "./lib/logger.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { applicationsRoutes } from "./modules/applications/applications.routes.js";
import { webhooksRoutes } from "./modules/webhooks/webhooks.routes.js";
import { customersRoutes } from "./modules/customers/customers.routes.js";
import { accountsRoutes } from "./modules/accounts/accounts.routes.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: loggerOptions });

  app.register(healthRoutes);
  app.register(applicationsRoutes);
  app.register(webhooksRoutes);
  app.register(customersRoutes);
  app.register(accountsRoutes);

  return app;
}
