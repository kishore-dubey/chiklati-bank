import type { FastifyReply, FastifyRequest } from "fastify";
import { getReadiness } from "./health.service.js";

export async function getLiveness(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await reply.send({ status: "ok" });
}

export async function getReadinessHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const result = await getReadiness();
  await reply.status(result.status === "ok" ? 200 : 503).send(result);
}
