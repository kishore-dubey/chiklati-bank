import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://chiklati:chiklati@localhost:5433/chiklati_bank?schema=public",
      REDIS_URL: "redis://localhost:6380",
      UNIT_API_TOKEN: "test-unit-api-token",
      UNIT_WEBHOOK_SECRET: "test-unit-webhook-secret",
      INTERNAL_API_SECRET: "test-internal-api-secret",
    },
  },
});
