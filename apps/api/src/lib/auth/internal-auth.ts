import type { FastifyReply, FastifyRequest } from "fastify";
import { jwtVerify } from "jose";
import { internalAuthClaimsSchema } from "@chiklati/shared";
import { env } from "../../config/env.js";

const secretKey = new TextEncoder().encode(env.INTERNAL_API_SECRET);

export async function internalAuthGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    await reply.status(401).send({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authorization.slice("Bearer ".length);

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const claims = internalAuthClaimsSchema.parse(payload);

    request.userId = claims.sub;
    request.userEmail = claims.email;
  } catch {
    await reply.status(401).send({ error: "Invalid or expired token" });
  }
}
