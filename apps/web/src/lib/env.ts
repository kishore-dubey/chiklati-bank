import { webEnvSchema, type WebEnv } from "@chiklati/shared";

function loadEnv(): WebEnv {
  const parsed = webEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment configuration:");
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

export const env: WebEnv = loadEnv();
