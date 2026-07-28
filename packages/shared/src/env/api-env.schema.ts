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
  UNIT_DEFAULT_DEPOSIT_PRODUCT: z.string().min(1).default("checking"),
  INTERNAL_API_SECRET: z.string().min(1, "INTERNAL_API_SECRET is required"),
  // Deliberately independent of NODE_ENV so a deployed container can run
  // NODE_ENV=production (structured JSON logs) while still opting in to
  // Unit's sandbox simulation endpoints for demoing full payment/card flows.
  ENABLE_SANDBOX_ROUTES: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
