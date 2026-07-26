import type { FastifyReply, FastifyRequest } from "fastify";
import { UnitApiError } from "../../lib/unit/unit-api-error.js";
import {
  PaymentNotEligibleError,
  simulateAchClear,
  simulateAchTransmit,
  simulateWireTransmit,
} from "./sandbox.service.js";

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
