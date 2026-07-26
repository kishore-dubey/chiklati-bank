import { unitRequest } from "./unit-client.js";
import type { UnitPaymentDocument } from "./unit-payments.types.js";
import type { JsonApiDocument } from "./unit-client.types.js";

export interface UnitPurchaseTransactionAttributes {
  createdAt: string;
  amount: number;
  direction: "Debit";
  balance: number;
  merchantName: string;
  merchantType: number;
  last4Digits: string;
  recurring: boolean;
}

export type UnitPurchaseTransactionDocument = JsonApiDocument<UnitPurchaseTransactionAttributes>;

export async function transmitAchPayment(unitPaymentId: string): Promise<UnitPaymentDocument> {
  return unitRequest<UnitPaymentDocument>("POST", "/sandbox/ach/transmit", {
    data: {
      type: "transmitAchPayment",
      relationships: { payment: { data: { type: "achPayment", id: unitPaymentId } } },
    },
  });
}

export async function clearAchPayment(unitPaymentId: string): Promise<UnitPaymentDocument> {
  return unitRequest<UnitPaymentDocument>("POST", "/sandbox/ach/clear", {
    data: {
      type: "clearAchPayment",
      relationships: { payment: { data: { type: "achPayment", id: unitPaymentId } } },
    },
  });
}

export async function transmitWirePayment(unitPaymentId: string): Promise<UnitPaymentDocument> {
  return unitRequest<UnitPaymentDocument>("POST", "/sandbox/wire/transmit", {
    data: {
      type: "transmitWirePayment",
      // Unit's sandbox transmit endpoint expects the JSON:API resource type
      // "fedWirePayment" here, NOT "wirePayment" (the type used everywhere
      // else for wire payments, including the create response) -- confirmed
      // empirically against a 400 rejecting "wirePayment".
      relationships: { payment: { data: { type: "fedWirePayment", id: unitPaymentId } } },
    },
  });
}

export async function simulateCardPurchase(
  unitAccountId: string,
  last4Digits: string,
  amount: number,
  merchantName: string,
): Promise<UnitPurchaseTransactionDocument> {
  return unitRequest<UnitPurchaseTransactionDocument>("POST", "/sandbox/purchases", {
    data: {
      type: "purchaseTransaction",
      attributes: {
        amount,
        direction: "Debit",
        merchantName,
        // Merchant Category Code -- required by Unit's sandbox purchase
        // simulator; 5812 = "Eating Places and Restaurants", an arbitrary
        // but valid real-world MCC, fine for simulating generic spend.
        merchantType: 5812,
        recurring: false,
        last4Digits,
      },
      // Confirmed empirically: this endpoint's relationship is to the
      // *account*, not the card (a "card" relationship here 400s) --
      // the card is instead identified by last4Digits in attributes.
      relationships: { account: { data: { type: "account", id: unitAccountId } } },
    },
  });
}
