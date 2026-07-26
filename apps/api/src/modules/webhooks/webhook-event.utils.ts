import type { IncomingUnitEvent } from "./webhooks.service.js";

interface HasRelationships {
  relationships?: Record<string, { data: { id: string } | { id: string }[] | null }>;
}

// Structurally typed so this also works against a fetched JsonApiResource
// (e.g. a Transaction resource's own relationships.payment), not just the
// thin webhook event envelope -- no behavior change for existing callers.
export function getRelationshipId(resource: HasRelationships, relationshipName: string): string | undefined {
  const data = resource.relationships?.[relationshipName]?.data;
  if (!data || Array.isArray(data)) {
    return undefined;
  }
  return data.id;
}

export function getEventCreatedAt(event: IncomingUnitEvent): Date {
  const raw = event.attributes?.["createdAt"];
  return typeof raw === "string" ? new Date(raw) : new Date();
}
