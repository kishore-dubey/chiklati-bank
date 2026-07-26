import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export interface CachedIdempotentResponse {
  statusCode: number;
  payload: string;
}

export interface IdempotencyHooks {
  preHandler: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  onSend: (request: FastifyRequest, reply: FastifyReply, payload: unknown) => Promise<unknown>;
  onError: (request: FastifyRequest, reply: FastifyReply, error: FastifyError) => Promise<void>;
}
