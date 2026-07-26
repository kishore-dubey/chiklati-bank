import type { FastifyReply, FastifyRequest } from "fastify";
import { createCounterpartyInputSchema } from "@chiklati/shared";
import { UnitApiError } from "../../lib/unit/unit-api-error.js";
import {
  CustomerNotEligibleError,
  createCounterparty,
  getCounterpartyById,
  listCounterparties,
} from "./counterparties.service.js";

export async function postCounterparty(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = createCounterpartyInputSchema.safeParse(request.body);

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
    const counterparty = await createCounterparty(request.userId, parsed.data, idempotencyKey);
    await reply.status(201).send(counterparty);
  } catch (error) {
    if (error instanceof CustomerNotEligibleError) {
      await reply.status(404).send({ error: error.message });
      return;
    }
    if (error instanceof UnitApiError) {
      await reply.status(422).send({ error: "Unit rejected the counterparty creation", details: error.errors });
      return;
    }
    throw error;
  }
}

export async function getCounterparties(
  request: FastifyRequest<{ Querystring: { customerId?: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const counterparties = await listCounterparties(request.userId, request.query.customerId);
  await reply.status(200).send(counterparties);
}

export async function getCounterparty(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const counterparty = await getCounterpartyById(request.params.id, request.userId);

  if (!counterparty) {
    await reply.status(404).send({ error: "Counterparty not found" });
    return;
  }

  await reply.status(200).send(counterparty);
}
