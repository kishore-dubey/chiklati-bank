import { unitRequest } from "./unit-client.js";
import type {
  UnitCounterpartyDocument,
  UnitCreateAchCounterpartyRequestAttributes,
} from "./unit-payments.types.js";

export async function createAchCounterparty(
  unitCustomerId: string,
  attributes: UnitCreateAchCounterpartyRequestAttributes,
): Promise<UnitCounterpartyDocument> {
  return unitRequest<UnitCounterpartyDocument>("POST", "/counterparties", {
    data: {
      type: "achCounterparty",
      attributes,
      relationships: { customer: { data: { type: "customer", id: unitCustomerId } } },
    },
  });
}

export async function getCounterparty(unitCounterpartyId: string): Promise<UnitCounterpartyDocument> {
  return unitRequest<UnitCounterpartyDocument>("GET", `/counterparties/${unitCounterpartyId}`);
}
