import type { FastifyInstance } from "fastify";
import { internalAuthGuard } from "../../lib/auth/internal-auth.js";
import { createIdempotencyHooks } from "../../lib/idempotency/idempotency.js";
import {
  getCard,
  getCards,
  postCard,
  postCardClose,
  postCardFreeze,
  postCardReportLost,
  postCardReportStolen,
  postCardUnfreeze,
} from "./cards.controller.js";

const createIdempotency = createIdempotencyHooks("cards");
const freezeIdempotency = createIdempotencyHooks("cards-freeze");
const unfreezeIdempotency = createIdempotencyHooks("cards-unfreeze");
const closeIdempotency = createIdempotencyHooks("cards-close");
const reportStolenIdempotency = createIdempotencyHooks("cards-report-stolen");
const reportLostIdempotency = createIdempotencyHooks("cards-report-lost");

export async function cardsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/cards",
    {
      preHandler: [internalAuthGuard, createIdempotency.preHandler],
      onSend: createIdempotency.onSend,
      onError: createIdempotency.onError,
    },
    postCard,
  );

  app.get<{ Querystring: { accountId?: string } }>("/cards", { preHandler: [internalAuthGuard] }, getCards);

  app.get<{ Params: { id: string } }>("/cards/:id", { preHandler: [internalAuthGuard] }, getCard);

  app.post<{ Params: { id: string } }>(
    "/cards/:id/freeze",
    {
      preHandler: [internalAuthGuard, freezeIdempotency.preHandler],
      onSend: freezeIdempotency.onSend,
      onError: freezeIdempotency.onError,
    },
    postCardFreeze,
  );

  app.post<{ Params: { id: string } }>(
    "/cards/:id/unfreeze",
    {
      preHandler: [internalAuthGuard, unfreezeIdempotency.preHandler],
      onSend: unfreezeIdempotency.onSend,
      onError: unfreezeIdempotency.onError,
    },
    postCardUnfreeze,
  );

  app.post<{ Params: { id: string } }>(
    "/cards/:id/close",
    {
      preHandler: [internalAuthGuard, closeIdempotency.preHandler],
      onSend: closeIdempotency.onSend,
      onError: closeIdempotency.onError,
    },
    postCardClose,
  );

  app.post<{ Params: { id: string } }>(
    "/cards/:id/report-stolen",
    {
      preHandler: [internalAuthGuard, reportStolenIdempotency.preHandler],
      onSend: reportStolenIdempotency.onSend,
      onError: reportStolenIdempotency.onError,
    },
    postCardReportStolen,
  );

  app.post<{ Params: { id: string } }>(
    "/cards/:id/report-lost",
    {
      preHandler: [internalAuthGuard, reportLostIdempotency.preHandler],
      onSend: reportLostIdempotency.onSend,
      onError: reportLostIdempotency.onError,
    },
    postCardReportLost,
  );
}
