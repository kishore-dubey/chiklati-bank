import { z } from "zod";

export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  UNIT_API_BASE_URL: z.url().default("https://api.s.unit.sh"),
  UNIT_API_TOKEN: z.string().min(1, "UNIT_API_TOKEN is required"),
  UNIT_WEBHOOK_SECRET: z.string().min(1, "UNIT_WEBHOOK_SECRET is required"),
  INTERNAL_API_SECRET: z.string().min(1, "INTERNAL_API_SECRET is required"),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
