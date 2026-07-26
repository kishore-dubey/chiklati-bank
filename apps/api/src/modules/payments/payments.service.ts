import { PaymentDirection, type Payment } from "@chiklati/db";
import type { CreatePaymentInput, PaymentResponse } from "@chiklati/shared";
import { createBookPayment, createAchPayment, createWirePayment } from "../../lib/unit/payments.resource.js";
import { findAccountById } from "../accounts/accounts.repository.js";
import { findCounterpartyById } from "../counterparties/counterparties.repository.js";
import {
  createPaymentRecord,
  findPaymentById,
  findPaymentsForUser,
} from "./payments.repository.js";
import {
  toLocalPaymentStatus,
  toPaymentResponse,
  toUnitAchPaymentAttributes,
  toUnitBookPaymentAttributes,
  toUnitWirePaymentAttributes,
} from "./payments.mapper.js";

export class AccountNotEligibleError extends Error {
  constructor(accountId: string) {
    super(`No account ${accountId} found for this user`);
    this.name = "AccountNotEligibleError";
  }
}

export class CounterpartyNotEligibleError extends Error {
  constructor(counterpartyId: string) {
    super(`No counterparty ${counterpartyId} found for this user`);
    this.name = "CounterpartyNotEligibleError";
  }
}

export async function createPayment(
  userId: string,
  input: CreatePaymentInput,
  idempotencyKey: string,
): Promise<PaymentResponse> {
  const account = await findAccountById(input.accountId, userId);

  if (!account) {
    throw new AccountNotEligibleError(input.accountId);
  }

  let record: Payment;

  if (input.rail === "book") {
    const counterpartyAccount = await findAccountById(input.counterpartyAccountId, userId);

    if (!counterpartyAccount) {
      throw new AccountNotEligibleError(input.counterpartyAccountId);
    }

    const unitDocument = await createBookPayment(
      account.unitAccountId,
      counterpartyAccount.unitAccountId,
      toUnitBookPaymentAttributes(input, idempotencyKey),
    );
    const attrs = unitDocument.data.attributes;

    record = await createPaymentRecord({
      unitPaymentId: unitDocument.data.id,
      rail: "Book",
      accountId: account.id,
      userId,
      direction: PaymentDirection.Credit,
      amount: BigInt(attrs.amount),
      status: toLocalPaymentStatus(attrs.status),
      description: attrs.description,
      counterpartyId: null,
      counterpartySnapshot: {
        counterpartyAccountId: counterpartyAccount.id,
        unitAccountId: counterpartyAccount.unitAccountId,
      },
      tags: attrs.tags ?? null,
    });
  } else if (input.rail === "ach") {
    const counterparty = await findCounterpartyById(input.counterpartyId, userId);

    if (!counterparty) {
      throw new CounterpartyNotEligibleError(input.counterpartyId);
    }

    const unitDocument = await createAchPayment(
      account.unitAccountId,
      counterparty.unitCounterpartyId,
      toUnitAchPaymentAttributes(input, idempotencyKey),
    );
    const attrs = unitDocument.data.attributes;

    record = await createPaymentRecord({
      unitPaymentId: unitDocument.data.id,
      rail: "Ach",
      accountId: account.id,
      userId,
      direction: input.direction === "Debit" ? PaymentDirection.Debit : PaymentDirection.Credit,
      amount: BigInt(attrs.amount),
      status: toLocalPaymentStatus(attrs.status),
      description: attrs.description,
      counterpartyId: counterparty.id,
      counterpartySnapshot: {
        counterpartyId: counterparty.id,
        unitCounterpartyId: counterparty.unitCounterpartyId,
        name: counterparty.name,
        routingNumber: counterparty.routingNumber,
        accountNumber: counterparty.accountNumber,
        accountType: counterparty.accountType,
      },
      tags: attrs.tags ?? null,
    });
  } else {
    const unitDocument = await createWirePayment(
      account.unitAccountId,
      toUnitWirePaymentAttributes(input, idempotencyKey),
    );
    const attrs = unitDocument.data.attributes;

    record = await createPaymentRecord({
      unitPaymentId: unitDocument.data.id,
      rail: "Wire",
      accountId: account.id,
      userId,
      direction: PaymentDirection.Credit,
      amount: BigInt(attrs.amount),
      status: toLocalPaymentStatus(attrs.status),
      description: attrs.description,
      counterpartyId: null,
      counterpartySnapshot: input.counterparty,
      tags: attrs.tags ?? null,
    });
  }

  return toPaymentResponse(record);
}

export async function listPayments(userId: string, accountId?: string): Promise<PaymentResponse[]> {
  const records = await findPaymentsForUser(userId, accountId);
  return records.map(toPaymentResponse);
}

export async function getPaymentById(id: string, userId: string): Promise<PaymentResponse | null> {
  const record = await findPaymentById(id, userId);
  return record ? toPaymentResponse(record) : null;
}
