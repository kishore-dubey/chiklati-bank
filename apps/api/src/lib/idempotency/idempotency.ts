import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { redis } from "../redis.js";
import type { CachedIdempotentResponse, IdempotencyHooks } from "./idempotency.types.js";

const PROCESSING_TTL_SECONDS = 30;
const COMPLETED_TTL_SECONDS = 60 * 60 * 24;
const PROCESSING_MARKER = "__PROCESSING__";

function buildKey(scope: string, userId: string, idempotencyKey: string): string {
  return `idem:${scope}:${userId}:${idempotencyKey}`;
}

export function createIdempotencyHooks(scope: string): IdempotencyHooks {
  const preHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const header = request.headers["idempotency-key"];
    const idempotencyKey = Array.isArray(header) ? header[0] : header;

    if (!idempotencyKey) {
      await reply.status(400).send({ error: "Idempotency-Key header is required" });
      return;
    }

    if (!request.userId) {
      await reply.status(401).send({ error: "Unauthenticated" });
      return;
    }

    const redisKey = buildKey(scope, request.userId, idempotencyKey);
    const lockResult = await redis.set(redisKey, PROCESSING_MARKER, "EX", PROCESSING_TTL_SECONDS, "NX");

    if (lockResult === null) {
      const existing = await redis.get(redisKey);

      if (existing === null || existing === PROCESSING_MARKER) {
        await reply
          .status(409)
          .send({ error: "A request with this Idempotency-Key is already being processed" });
        return;
      }

      const cached = JSON.parse(existing) as CachedIdempotentResponse;
      await reply.status(cached.statusCode).type("application/json").send(cached.payload);
      return;
    }

    request.idempotencyRedisKey = redisKey;
  };

  const onSend = async (
    request: FastifyRequest,
    reply: FastifyReply,
    payload: unknown,
  ): Promise<unknown> => {
    const redisKey = request.idempotencyRedisKey;

    if (!redisKey) {
      return payload;
    }

    if (reply.statusCode < 500 && typeof payload === "string") {
      const cached: CachedIdempotentResponse = { statusCode: reply.statusCode, payload };
      await redis.set(redisKey, JSON.stringify(cached), "EX", COMPLETED_TTL_SECONDS);
    } else {
      await redis.del(redisKey);
    }

    return payload;
  };

  const onError = async (
    request: FastifyRequest,
    _reply: FastifyReply,
    _error: FastifyError,
  ): Promise<void> => {
    if (request.idempotencyRedisKey) {
      await redis.del(request.idempotencyRedisKey);
    }
  };

  return { preHandler, onSend, onError };
}
