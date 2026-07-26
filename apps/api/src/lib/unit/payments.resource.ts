import { unitRequest } from "./unit-client.js";
import type {
  UnitCreateAchPaymentRequestAttributes,
  UnitCreateBookPaymentRequestAttributes,
  UnitCreateWirePaymentRequestAttributes,
  UnitPaymentDocument,
} from "./unit-payments.types.js";

export async function createBookPayment(
  unitAccountId: string,
  counterpartyAccountId: string,
  attributes: UnitCreateBookPaymentRequestAttributes,
): Promise<UnitPaymentDocument> {
  return unitRequest<UnitPaymentDocument>("POST", "/payments", {
    data: {
      type: "bookPayment",
      attributes,
      relationships: {
        account: { data: { type: "depositAccount", id: unitAccountId } },
        counterpartyAccount: { data: { type: "depositAccount", id: counterpartyAccountId } },
      },
    },
  });
}

export async function createAchPayment(
  unitAccountId: string,
  unitCounterpartyId: string,
  attributes: UnitCreateAchPaymentRequestAttributes,
): Promise<UnitPaymentDocument> {
  return unitRequest<UnitPaymentDocument>("POST", "/payments", {
    data: {
      type: "achPayment",
      attributes,
      relationships: {
        account: { data: { type: "depositAccount", id: unitAccountId } },
        counterparty: { data: { type: "counterparty", id: unitCounterpartyId } },
      },
    },
  });
}

export async function createWirePayment(
  unitAccountId: string,
  attributes: UnitCreateWirePaymentRequestAttributes,
): Promise<UnitPaymentDocument> {
  return unitRequest<UnitPaymentDocument>("POST", "/payments", {
    data: {
      type: "wirePayment",
      attributes,
      relationships: {
        account: { data: { type: "depositAccount", id: unitAccountId } },
      },
    },
  });
}

export async function getPayment(unitPaymentId: string): Promise<UnitPaymentDocument> {
  return unitRequest<UnitPaymentDocument>("GET", `/payments/${unitPaymentId}`);
}
