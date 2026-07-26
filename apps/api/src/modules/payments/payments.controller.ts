import type { FastifyReply, FastifyRequest } from "fastify";
import { createPaymentInputSchema } from "@chiklati/shared";
import { UnitApiError } from "../../lib/unit/unit-api-error.js";
import {
  AccountNotEligibleError,
  CounterpartyNotEligibleError,
  createPayment,
  getPaymentById,
  listPayments,
} from "./payments.service.js";

export async function postPayment(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = createPaymentInputSchema.safeParse(request.body);

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
    const payment = await createPayment(request.userId, parsed.data, idempotencyKey);
    await reply.status(201).send(payment);
  } catch (error) {
    if (error instanceof AccountNotEligibleError || error instanceof CounterpartyNotEligibleError) {
      await reply.status(404).send({ error: error.message });
      return;
    }
    if (error instanceof UnitApiError) {
      await reply.status(422).send({ error: "Unit rejected the payment", details: error.errors });
      return;
    }
    throw error;
  }
}

export async function getPayments(
  request: FastifyRequest<{ Querystring: { accountId?: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const payments = await listPayments(request.userId, request.query.accountId);
  await reply.status(200).send(payments);
}

export async function getPayment(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const payment = await getPaymentById(request.params.id, request.userId);

  if (!payment) {
    await reply.status(404).send({ error: "Payment not found" });
    return;
  }

  await reply.status(200).send(payment);
}
