import { apiEnvSchema, type ApiEnv } from "@chiklati/shared";

function loadEnv(): ApiEnv {
  const parsed = apiEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment configuration:");
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

export const env: ApiEnv = loadEnv();
