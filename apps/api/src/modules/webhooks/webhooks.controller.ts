import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env.js";
import { verifyUnitSignature } from "./webhooks.signature.js";
import { ingestWebhookEvents, type IncomingUnitEvent } from "./webhooks.service.js";

interface UnitWebhookEnvelope {
  data: IncomingUnitEvent[];
}

export async function postUnitWebhook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const rawBody = request.body as Buffer;
  const signature = request.headers["x-unit-signature"];

  if (!verifyUnitSignature(rawBody, signature, env.UNIT_WEBHOOK_SECRET)) {
    await reply.status(401).send({ error: "Invalid signature" });
    return;
  }

  let envelope: UnitWebhookEnvelope;
  try {
    envelope = JSON.parse(rawBody.toString("utf8")) as UnitWebhookEnvelope;
  } catch {
    await reply.status(400).send({ error: "Invalid JSON body" });
    return;
  }

  const received = await ingestWebhookEvents(envelope.data ?? []);
  await reply.status(200).send({ received });
}
