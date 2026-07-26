import { unitRequest } from "./unit-client.js";
import type { UnitPaymentDocument } from "./unit-payments.types.js";

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
