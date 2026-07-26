import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import { prisma } from "@chiklati/db";
import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import { redis } from "../src/lib/redis.js";
import { env } from "../src/config/env.js";

const mockCreateIndividualApplication = vi.fn();

vi.mock("../src/lib/unit/applications.resource.js", () => ({
  createIndividualApplication: (...args: unknown[]) => mockCreateIndividualApplication(...args),
  createBusinessApplication: vi.fn(),
  getApplication: vi.fn(),
}));

const { buildApp } = await import("../src/app.js");

function unitDocumentFixture(id: string, status: string): unknown {
  return {
    data: {
      id,
      type: "individualApplication",
      attributes: { createdAt: new Date().toISOString(), status },
    },
  };
}

function individualPayload(): Record<string, unknown> {
  return {
    type: "individual",
    ssn: "000000004",
    fullName: { first: "Test", last: "User" },
    dateOfBirth: "1990-01-01",
    address: { street: "1 Test St", city: "Testville", state: "CA", postalCode: "90210", country: "US" },
    phone: { countryCode: "1", number: "5555550000" },
    email: "idem-applicant@example.com",
    occupation: "ScientistOrTechnologist",
  };
}

describe("idempotency middleware (POST /applications, real local Redis)", () => {
  let app: FastifyInstance;
  let userId: string;
  let token: string;
  const usedKeys: string[] = [];

  beforeAll(async () => {
    app = buildApp();

    const user = await prisma.user.create({
      data: { email: `idem-test-${randomUUID()}@example.com`, passwordHash: "unused" },
    });
    userId = user.id;

    const secretKey = new TextEncoder().encode(env.INTERNAL_API_SECRET);
    token = await new SignJWT({ sub: userId, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("5m")
      .sign(secretKey);
  });

  afterAll(async () => {
    await app.close();
    await prisma.application.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    for (const key of usedKeys) {
      await redis.del(`idem:applications:${userId}:${key}`);
    }
  });

  function post(key: string): Promise<LightMyRequestResponse> {
    return app.inject({
      method: "POST",
      url: "/applications",
      headers: { authorization: `Bearer ${token}`, "idempotency-key": key },
      payload: individualPayload(),
    });
  }

  it("executes and caches on the first request", async () => {
    const key = randomUUID();
    usedKeys.push(key);
    mockCreateIndividualApplication.mockResolvedValueOnce(unitDocumentFixture(`unit-${key}`, "PendingReview"));

    const response = await post(key);

    expect(response.statusCode).toBe(201);
    expect(mockCreateIndividualApplication).toHaveBeenCalledTimes(1);
  });

  it("returns 409 for a concurrent duplicate while the first request is still processing", async () => {
    const key = randomUUID();
    usedKeys.push(key);
    mockCreateIndividualApplication.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return unitDocumentFixture(`unit-${key}`, "PendingReview");
    });

    const firstRequest = post(key);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = await post(key);

    expect(second.statusCode).toBe(409);

    const first = await firstRequest;
    expect(first.statusCode).toBe(201);
  });

  it("replays the cached response after completion without re-invoking the Unit client", async () => {
    const key = randomUUID();
    usedKeys.push(key);
    mockCreateIndividualApplication.mockResolvedValueOnce(unitDocumentFixture(`unit-${key}`, "Approved"));

    const first = await post(key);
    expect(first.statusCode).toBe(201);

    const callsAfterFirst = mockCreateIndividualApplication.mock.calls.length;

    const second = await post(key);

    expect(second.statusCode).toBe(201);
    expect(second.json()).toEqual(first.json());
    expect(mockCreateIndividualApplication).toHaveBeenCalledTimes(callsAfterFirst);
  });

  it("executes fresh for a different idempotency key", async () => {
    const keyA = randomUUID();
    const keyB = randomUUID();
    usedKeys.push(keyA, keyB);

    mockCreateIndividualApplication.mockResolvedValueOnce(unitDocumentFixture(`unit-${keyA}`, "Denied"));
    mockCreateIndividualApplication.mockResolvedValueOnce(unitDocumentFixture(`unit-${keyB}`, "Denied"));

    const responseA = await post(keyA);
    const responseB = await post(keyB);

    expect(responseA.statusCode).toBe(201);
    expect(responseB.statusCode).toBe(201);
    expect(responseA.json().id).not.toBe(responseB.json().id);
  });

  it("returns 400 when the Idempotency-Key header is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/applications",
      headers: { authorization: `Bearer ${token}` },
      payload: individualPayload(),
    });

    expect(response.statusCode).toBe(400);
  });
});
