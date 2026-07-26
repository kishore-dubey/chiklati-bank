import type { FastifyInstance } from "fastify";
import { getLiveness, getReadinessHandler } from "./health.controller.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", getLiveness);
  app.get("/health/ready", getReadinessHandler);
}
