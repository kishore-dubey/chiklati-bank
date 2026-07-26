import type { FastifyReply, FastifyRequest } from "fastify";
import { createCardInputSchema } from "@chiklati/shared";
import { UnitApiError } from "../../lib/unit/unit-api-error.js";
import {
  AccountNotEligibleError,
  CardNotEligibleError,
  CardholderRequiredError,
  closeCard,
  freezeCard,
  getCardById,
  issueCard,
  listCards,
  reportCardLost,
  reportCardStolen,
  unfreezeCard,
} from "./cards.service.js";

function getIdempotencyKey(request: FastifyRequest): string | undefined {
  const header = request.headers["idempotency-key"];
  return Array.isArray(header) ? header[0] : header;
}

export async function postCard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = createCardInputSchema.safeParse(request.body);

  if (!parsed.success) {
    await reply.status(400).send({ error: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  const idempotencyKey = getIdempotencyKey(request);

  if (!request.userId || !idempotencyKey) {
    await reply.status(400).send({ error: "Missing authentication or Idempotency-Key" });
    return;
  }

  try {
    const card = await issueCard(request.userId, parsed.data, idempotencyKey);
    await reply.status(201).send(card);
  } catch (error) {
    if (error instanceof AccountNotEligibleError) {
      await reply.status(404).send({ error: error.message });
      return;
    }
    if (error instanceof CardholderRequiredError) {
      await reply.status(400).send({ error: error.message });
      return;
    }
    if (error instanceof UnitApiError) {
      await reply.status(422).send({ error: "Unit rejected the card", details: error.errors });
      return;
    }
    throw error;
  }
}

export async function getCards(
  request: FastifyRequest<{ Querystring: { accountId?: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const cards = await listCards(request.userId, request.query.accountId);
  await reply.status(200).send(cards);
}

export async function getCard(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const card = await getCardById(request.params.id, request.userId);

  if (!card) {
    await reply.status(404).send({ error: "Card not found" });
    return;
  }

  await reply.status(200).send(card);
}

function makeCardActionHandler(
  action: (id: string, userId: string) => ReturnType<typeof freezeCard>,
) {
  return async function handler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    if (!request.userId) {
      await reply.status(401).send({ error: "Unauthenticated" });
      return;
    }

    try {
      const card = await action(request.params.id, request.userId);
      await reply.status(200).send(card);
    } catch (error) {
      if (error instanceof CardNotEligibleError) {
        await reply.status(404).send({ error: error.message });
        return;
      }
      if (error instanceof UnitApiError) {
        await reply.status(422).send({ error: "Unit rejected the action", details: error.errors });
        return;
      }
      throw error;
    }
  };
}

export const postCardFreeze = makeCardActionHandler(freezeCard);
export const postCardUnfreeze = makeCardActionHandler(unfreezeCard);
export const postCardClose = makeCardActionHandler(closeCard);
export const postCardReportStolen = makeCardActionHandler(reportCardStolen);
export const postCardReportLost = makeCardActionHandler(reportCardLost);
