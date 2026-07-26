import type { FastifyInstance } from "fastify";
import { postUnitWebhook } from "./webhooks.controller.js";

const rawBodyParser = (
  _request: unknown,
  body: Buffer,
  done: (err: Error | null, body?: Buffer) => void,
): void => {
  done(null, body);
};

export async function webhooksRoutes(app: FastifyInstance): Promise<void> {
  // Scoped to this plugin's encapsulation context only: capture the raw body so
  // the HMAC signature can be verified against the exact bytes Unit sent, before
  // any JSON parsing happens. "application/json" must be overridden explicitly --
  // Fastify's built-in JSON parser for that exact content-type takes priority over
  // a "*" wildcard parser, which only catches content-types with no other parser.
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, rawBodyParser);
  app.addContentTypeParser("*", { parseAs: "buffer" }, rawBodyParser);

  app.post("/webhooks/unit", postUnitWebhook);
}
