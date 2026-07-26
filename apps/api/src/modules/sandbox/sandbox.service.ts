import {
  clearAchPayment,
  simulateCardPurchase as simulateCardPurchaseUnit,
  transmitAchPayment,
  transmitWirePayment,
} from "../../lib/unit/sandbox.resource.js";
import { findAccountById } from "../accounts/accounts.repository.js";
import { findCardById } from "../cards/cards.repository.js";
import { findPaymentById } from "../payments/payments.repository.js";

export class PaymentNotEligibleError extends Error {
  constructor(paymentId: string) {
    super(`No payment ${paymentId} found for this user`);
    this.name = "PaymentNotEligibleError";
  }
}

export class CardNotEligibleError extends Error {
  constructor(cardId: string) {
    super(`No card ${cardId} found for this user`);
    this.name = "CardNotEligibleError";
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

// Like the ACH/Wire simulations above, this only triggers Unit's sandbox
// purchase simulator -- it does NOT mutate the local Card or Account rows
// itself. The resulting balance/ledger update happens exclusively through
// the normal transaction.created webhook pipeline.
export async function simulateCardPurchase(
  cardId: string,
  userId: string,
  amount: number,
  merchantName: string,
): Promise<void> {
  const card = await findCardById(cardId, userId);

  if (!card) {
    throw new CardNotEligibleError(cardId);
  }

  const account = await findAccountById(card.accountId, userId);

  if (!account) {
    throw new CardNotEligibleError(cardId);
  }

  await simulateCardPurchaseUnit(account.unitAccountId, card.last4Digits, amount, merchantName);
}
