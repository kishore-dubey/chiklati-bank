import { env } from "../../config/env.js";
import { UnitApiError } from "./unit-api-error.js";
import type { JsonApiErrorDocument } from "./unit-client.types.js";

const JSON_API_CONTENT_TYPE = "application/vnd.api+json";

export async function unitRequest<TResponse>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown,
): Promise<TResponse> {
  const response = await fetch(`${env.UNIT_API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.UNIT_API_TOKEN}`,
      Accept: JSON_API_CONTENT_TYPE,
      ...(body !== undefined ? { "Content-Type": JSON_API_CONTENT_TYPE } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errors: JsonApiErrorDocument["errors"] = [];
    try {
      const errorDoc = (await response.json()) as JsonApiErrorDocument;
      errors = errorDoc.errors ?? [];
    } catch {
      errors = [];
    }
    throw new UnitApiError(response.status, errors);
  }

  return (await response.json()) as TResponse;
}
