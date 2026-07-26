import type { FastifyReply, FastifyRequest } from "fastify";
import { createApplicationInputSchema } from "@chiklati/shared";
import { UnitApiError } from "../../lib/unit/unit-api-error.js";
import { createApplication, getApplicationById } from "./applications.service.js";

export async function postApplication(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = createApplicationInputSchema.safeParse(request.body);

  if (!parsed.success) {
    await reply.status(400).send({ error: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  const idempotencyKeyHeader = request.headers["idempotency-key"];
  const idempotencyKey = Array.isArray(idempotencyKeyHeader)
    ? idempotencyKeyHeader[0]
    : idempotencyKeyHeader;

  if (!request.userId || !idempotencyKey) {
    await reply.status(400).send({ error: "Missing authentication or Idempotency-Key" });
    return;
  }

  try {
    const application = await createApplication(request.userId, parsed.data, idempotencyKey);
    await reply.status(201).send(application);
  } catch (error) {
    if (error instanceof UnitApiError) {
      await reply.status(422).send({ error: "Unit rejected the application", details: error.errors });
      return;
    }
    throw error;
  }
}

export async function getApplication(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const application = await getApplicationById(request.params.id, request.userId);

  if (!application) {
    await reply.status(404).send({ error: "Application not found" });
    return;
  }

  await reply.status(200).send(application);
}
