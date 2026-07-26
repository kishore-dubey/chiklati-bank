import Fastify, { type FastifyInstance } from "fastify";
import { loggerOptions } from "./lib/logger.js";
import { healthRoutes } from "./modules/health/health.routes.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: loggerOptions });

  app.register(healthRoutes);

  return app;
}
