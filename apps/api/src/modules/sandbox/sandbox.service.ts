import { clearAchPayment, transmitAchPayment, transmitWirePayment } from "../../lib/unit/sandbox.resource.js";
import { findPaymentById } from "../payments/payments.repository.js";

export class PaymentNotEligibleError extends Error {
  constructor(paymentId: string) {
    super(`No payment ${paymentId} found for this user`);
    this.name = "PaymentNotEligibleError";
  }
}

// These only trigger Unit's sandbox lifecycle simulation -- they do NOT
// mutate the local Payment row themselves. The status update happens
// exclusively through the normal webhook pipeline (payment.sent/clearing),
// keeping mutation to the single code path the rest of the system uses.
export async function simulateAchTransmit(paymentId: string, userId: string): Promise<void> {
  const payment = await findPaymentById(paymentId, userId);

  if (!payment) {
    throw new PaymentNotEligibleError(paymentId);
  }

  await transmitAchPayment(payment.unitPaymentId);
}

export async function simulateAchClear(paymentId: string, userId: string): Promise<void> {
  const payment = await findPaymentById(paymentId, userId);

  if (!payment) {
    throw new PaymentNotEligibleError(paymentId);
  }

  await clearAchPayment(payment.unitPaymentId);
}

export async function simulateWireTransmit(paymentId: string, userId: string): Promise<void> {
  const payment = await findPaymentById(paymentId, userId);

  if (!payment) {
    throw new PaymentNotEligibleError(paymentId);
  }

  await transmitWirePayment(payment.unitPaymentId);
}
