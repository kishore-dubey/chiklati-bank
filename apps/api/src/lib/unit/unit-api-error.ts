import type { JsonApiErrorObject } from "./unit-client.types.js";

export class UnitApiError extends Error {
  readonly statusCode: number;
  readonly errors: JsonApiErrorObject[];

  constructor(statusCode: number, errors: JsonApiErrorObject[]) {
    const summary = errors.map((error) => error.title).join("; ");
    super(summary || `Unit API request failed with status ${statusCode}`);
    this.name = "UnitApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
