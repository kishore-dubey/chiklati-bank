import type { AccountResponse, TransactionResponse } from "@chiklati/shared";
import { createDepositAccount } from "../../lib/unit/accounts.resource.js";
import { env } from "../../config/env.js";
import { findActiveCustomerForUser } from "../customers/customers.repository.js";
import {
  createAccountRecord,
  findAccountById,
  findAccountsForUser,
  findTransactionsForAccount,
} from "./accounts.repository.js";
import { toAccountResponse, toLocalAccountStatus, toTransactionResponse } from "./accounts.mapper.js";

export class CustomerNotEligibleError extends Error {
  constructor(customerId: string) {
    super(`No active customer ${customerId} found for this user`);
    this.name = "CustomerNotEligibleError";
  }
}

export async function createAccount(
  userId: string,
  customerId: string,
  idempotencyKey: string,
): Promise<AccountResponse> {
  const customer = await findActiveCustomerForUser(customerId, userId);

  if (!customer) {
    throw new CustomerNotEligibleError(customerId);
  }

  const unitDocument = await createDepositAccount(customer.unitCustomerId, {
    depositProduct: env.UNIT_DEFAULT_DEPOSIT_PRODUCT,
    idempotencyKey,
  });
  const attrs = unitDocument.data.attributes;

  const record = await createAccountRecord({
    unitAccountId: unitDocument.data.id,
    customerId: customer.id,
    userId,
    depositProduct: attrs.depositProduct,
    status: toLocalAccountStatus(attrs.status),
    currency: attrs.currency,
    balance: BigInt(attrs.balance),
    hold: BigInt(attrs.hold),
    available: BigInt(attrs.available),
    routingNumber: attrs.routingNumber,
    accountNumber: attrs.accountNumber,
    tags: attrs.tags ?? null,
  });

  return toAccountResponse(record);
}

export async function listAccounts(userId: string, customerId?: string): Promise<AccountResponse[]> {
  const records = await findAccountsForUser(userId, customerId);
  return records.map(toAccountResponse);
}

export async function getAccountById(id: string, userId: string): Promise<AccountResponse | null> {
  const record = await findAccountById(id, userId);
  return record ? toAccountResponse(record) : null;
}

export async function listTransactions(
  accountId: string,
  userId: string,
): Promise<TransactionResponse[] | null> {
  const account = await findAccountById(accountId, userId);

  if (!account) {
    return null;
  }

  const records = await findTransactionsForAccount(account.id);
  return records.map(toTransactionResponse);
}
