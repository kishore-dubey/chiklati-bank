import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { UnitApiError } from "../../lib/unit/unit-api-error.js";
import {
  CardNotEligibleError,
  PaymentNotEligibleError,
  simulateAchClear,
  simulateAchTransmit,
  simulateCardPurchase,
  simulateWireTransmit,
} from "./sandbox.service.js";

const cardPurchaseBodySchema = z.object({
  amount: z.string().regex(/^\d+$/, "amount must be a non-negative integer string (cents)"),
  merchantName: z.string().min(1).max(40),
});

export async function postAchTransmit(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  try {
    await simulateAchTransmit(request.params.id, request.userId);
    await reply.status(202).send({ accepted: true });
  } catch (error) {
    if (error instanceof PaymentNotEligibleError) {
      await reply.status(404).send({ error: error.message });
      return;
    }
    if (error instanceof UnitApiError) {
      await reply.status(422).send({ error: "Unit rejected the simulation request", details: error.errors });
      return;
    }
    throw error;
  }
}

export async function postAchClear(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  try {
    await simulateAchClear(request.params.id, request.userId);
    await reply.status(202).send({ accepted: true });
  } catch (error) {
    if (error instanceof PaymentNotEligibleError) {
      await reply.status(404).send({ error: error.message });
      return;
    }
    if (error instanceof UnitApiError) {
      await reply.status(422).send({ error: "Unit rejected the simulation request", details: error.errors });
      return;
    }
    throw error;
  }
}

export async function postCardPurchase(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const parsed = cardPurchaseBodySchema.safeParse(request.body);

  if (!parsed.success) {
    await reply.status(400).send({ error: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  try {
    await simulateCardPurchase(
      request.params.id,
      request.userId,
      Number(parsed.data.amount),
      parsed.data.merchantName,
    );
    await reply.status(202).send({ accepted: true });
  } catch (error) {
    if (error instanceof CardNotEligibleError) {
      await reply.status(404).send({ error: error.message });
      return;
    }
    if (error instanceof UnitApiError) {
      await reply.status(422).send({ error: "Unit rejected the simulation request", details: error.errors });
      return;
    }
    throw error;
  }
}

export async function postWireTransmit(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  try {
    await simulateWireTransmit(request.params.id, request.userId);
    await reply.status(202).send({ accepted: true });
  } catch (error) {
    if (error instanceof PaymentNotEligibleError) {
      await reply.status(404).send({ error: error.message });
      return;
    }
    if (error instanceof UnitApiError) {
      await reply.status(422).send({ error: "Unit rejected the simulation request", details: error.errors });
      return;
    }
    throw error;
  }
}
