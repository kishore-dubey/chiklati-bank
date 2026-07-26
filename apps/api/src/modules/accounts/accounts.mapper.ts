import { AccountStatus, type Account, type Transaction } from "@chiklati/db";
import type { AccountResponse, TransactionResponse } from "@chiklati/shared";
import type { UnitAccountAttributes } from "../../lib/unit/unit-accounts.types.js";

export function toLocalAccountStatus(status: UnitAccountAttributes["status"]): AccountStatus {
  return AccountStatus[status as keyof typeof AccountStatus];
}

export function toAccountResponse(record: Account): AccountResponse {
  return {
    id: record.id,
    unitAccountId: record.unitAccountId,
    customerId: record.customerId,
    depositProduct: record.depositProduct,
    status: record.status,
    currency: record.currency,
    balance: record.balance.toString(),
    hold: record.hold.toString(),
    available: record.available.toString(),
    routingNumber: record.routingNumber,
    accountNumber: record.accountNumber,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toTransactionResponse(record: Transaction): TransactionResponse {
  return {
    id: record.id,
    unitTransactionId: record.unitTransactionId,
    accountId: record.accountId,
    type: record.type,
    direction: record.direction,
    amount: record.amount.toString(),
    balance: record.balance.toString(),
    summary: record.summary,
    unitCreatedAt: record.unitCreatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}
