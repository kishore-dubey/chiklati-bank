import { prisma } from "@chiklati/db";
import { redis } from "../../lib/redis.js";

export type ReadinessCheck = "ok" | "error";

export interface ReadinessResult {
  status: "ok" | "error";
  checks: {
    database: ReadinessCheck;
    redis: ReadinessCheck;
  };
}

async function checkDatabase(): Promise<ReadinessCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

async function checkRedis(): Promise<ReadinessCheck> {
  try {
    const pong = await redis.ping();
    return pong === "PONG" ? "ok" : "error";
  } catch {
    return "error";
  }
}

export async function getReadiness(): Promise<ReadinessResult> {
  const [database, redisCheck] = await Promise.all([checkDatabase(), checkRedis()]);
  const status = database === "ok" && redisCheck === "ok" ? "ok" : "error";

  return { status, checks: { database, redis: redisCheck } };
}
