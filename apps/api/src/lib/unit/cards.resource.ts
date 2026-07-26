import { unitRequest } from "./unit-client.js";
import type {
  UnitCardDocument,
  UnitCreateBusinessCardRequestAttributes,
  UnitCreateIndividualCardRequestAttributes,
} from "./unit-cards.types.js";

export async function createIndividualVirtualCard(
  unitAccountId: string,
  attributes: UnitCreateIndividualCardRequestAttributes,
): Promise<UnitCardDocument> {
  return unitRequest<UnitCardDocument>("POST", "/cards", {
    data: {
      type: "individualVirtualDebitCard",
      attributes,
      relationships: {
        account: { data: { type: "depositAccount", id: unitAccountId } },
      },
    },
  });
}

export async function createBusinessVirtualCard(
  unitAccountId: string,
  attributes: UnitCreateBusinessCardRequestAttributes,
): Promise<UnitCardDocument> {
  return unitRequest<UnitCardDocument>("POST", "/cards", {
    data: {
      type: "businessVirtualDebitCard",
      attributes,
      relationships: {
        account: { data: { type: "depositAccount", id: unitAccountId } },
      },
    },
  });
}

export async function getCard(unitCardId: string): Promise<UnitCardDocument> {
  return unitRequest<UnitCardDocument>("GET", `/cards/${unitCardId}`);
}

export async function freezeCard(unitCardId: string): Promise<UnitCardDocument> {
  return unitRequest<UnitCardDocument>("POST", `/cards/${unitCardId}/freeze`, {
    data: { type: "freezeCard", attributes: {} },
  });
}

export async function unfreezeCard(unitCardId: string): Promise<UnitCardDocument> {
  return unitRequest<UnitCardDocument>("POST", `/cards/${unitCardId}/unfreeze`, {
    data: { type: "unfreezeCard", attributes: {} },
  });
}

export async function closeCard(unitCardId: string): Promise<UnitCardDocument> {
  return unitRequest<UnitCardDocument>("POST", `/cards/${unitCardId}/close`, {
    data: { type: "closeCard", attributes: {} },
  });
}

export async function reportStolenCard(unitCardId: string): Promise<UnitCardDocument> {
  return unitRequest<UnitCardDocument>("POST", `/cards/${unitCardId}/report-stolen`, {
    data: { type: "reportStolenCard", attributes: {} },
  });
}

export async function reportLostCard(unitCardId: string): Promise<UnitCardDocument> {
  return unitRequest<UnitCardDocument>("POST", `/cards/${unitCardId}/report-lost`, {
    data: { type: "reportLostCard", attributes: {} },
  });
}
