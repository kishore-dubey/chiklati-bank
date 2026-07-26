import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5433/test",
      REDIS_URL: "redis://localhost:6380",
    },
  },
});
