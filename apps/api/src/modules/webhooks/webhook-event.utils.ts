import type { IncomingUnitEvent } from "./webhooks.service.js";

export function getRelationshipId(event: IncomingUnitEvent, relationshipName: string): string | undefined {
  const data = event.relationships?.[relationshipName]?.data;
  if (!data || Array.isArray(data)) {
    return undefined;
  }
  return data.id;
}

export function getEventCreatedAt(event: IncomingUnitEvent): Date {
  const raw = event.attributes?.["createdAt"];
  return typeof raw === "string" ? new Date(raw) : new Date();
}
