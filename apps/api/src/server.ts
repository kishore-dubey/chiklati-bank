import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp();

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, "api server shutting down");
  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error(error, "error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
