import type { FastifyReply, FastifyRequest } from "fastify";
import { createAccountInputSchema } from "@chiklati/shared";
import { UnitApiError } from "../../lib/unit/unit-api-error.js";
import {
  CustomerNotEligibleError,
  createAccount,
  getAccountById,
  listAccounts,
  listTransactions,
} from "./accounts.service.js";

export async function postAccount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = createAccountInputSchema.safeParse(request.body);

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
    const account = await createAccount(request.userId, parsed.data.customerId, idempotencyKey);
    await reply.status(201).send(account);
  } catch (error) {
    if (error instanceof CustomerNotEligibleError) {
      await reply.status(404).send({ error: error.message });
      return;
    }
    if (error instanceof UnitApiError) {
      await reply.status(422).send({ error: "Unit rejected the account creation", details: error.errors });
      return;
    }
    throw error;
  }
}

export async function getAccounts(
  request: FastifyRequest<{ Querystring: { customerId?: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const accounts = await listAccounts(request.userId, request.query.customerId);
  await reply.status(200).send(accounts);
}

export async function getAccount(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const account = await getAccountById(request.params.id, request.userId);

  if (!account) {
    await reply.status(404).send({ error: "Account not found" });
    return;
  }

  await reply.status(200).send(account);
}

export async function getAccountTransactions(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const transactions = await listTransactions(request.params.id, request.userId);

  if (transactions === null) {
    await reply.status(404).send({ error: "Account not found" });
    return;
  }

  await reply.status(200).send(transactions);
}
