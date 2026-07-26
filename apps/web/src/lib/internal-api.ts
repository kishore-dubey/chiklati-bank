import { SignJWT } from "jose";
import { auth } from "@/auth";
import { env } from "@/lib/env";

const secretKey = new TextEncoder().encode(env.INTERNAL_API_SECRET);

async function mintInternalToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("60s")
    .sign(secretKey);
}

export interface InternalApiResult<T> {
  status: number;
  body: T;
}

interface CallInternalApiOptions {
  method: "GET" | "POST";
  body?: string;
  idempotencyKey?: string;
}

export async function callInternalApi<T>(
  path: string,
  options: CallInternalApiOptions,
): Promise<InternalApiResult<T>> {
  const session = await auth();

  if (!session?.user.id || !session.user.email) {
    throw new Error("Not authenticated");
  }

  const token = await mintInternalToken(session.user.id, session.user.email);

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  const response = await fetch(`${env.API_URL}${path}`, {
    method: options.method,
    headers,
    body: options.body,
    cache: "no-store",
  });

  const body = (await response.json()) as T;
  return { status: response.status, body };
}
