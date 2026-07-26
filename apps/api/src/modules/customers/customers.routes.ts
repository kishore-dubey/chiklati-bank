import type { FastifyInstance } from "fastify";
import { internalAuthGuard } from "../../lib/auth/internal-auth.js";
import { getCustomers } from "./customers.controller.js";

export async function customersRoutes(app: FastifyInstance): Promise<void> {
  app.get("/customers", { preHandler: [internalAuthGuard] }, getCustomers);
}
