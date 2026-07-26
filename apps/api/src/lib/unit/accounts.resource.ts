import { unitRequest } from "./unit-client.js";
import type {
  UnitAccountDocument,
  UnitCreateAccountRequestAttributes,
  UnitTransactionDocument,
  UnitTransactionListDocument,
} from "./unit-accounts.types.js";

export async function createDepositAccount(
  unitCustomerId: string,
  attributes: UnitCreateAccountRequestAttributes,
): Promise<UnitAccountDocument> {
  return unitRequest<UnitAccountDocument>("POST", "/accounts", {
    data: {
      type: "depositAccount",
      attributes,
      relationships: { customer: { data: { type: "customer", id: unitCustomerId } } },
    },
  });
}

export async function getAccount(unitAccountId: string): Promise<UnitAccountDocument> {
  return unitRequest<UnitAccountDocument>("GET", `/accounts/${unitAccountId}`);
}

export async function listAccountTransactions(
  unitAccountId: string,
): Promise<UnitTransactionListDocument> {
  const query = new URLSearchParams({ "filter[accountId]": unitAccountId });
  return unitRequest<UnitTransactionListDocument>("GET", `/transactions?${query.toString()}`);
}

export async function getTransaction(
  unitAccountId: string,
  unitTransactionId: string,
): Promise<UnitTransactionDocument> {
  return unitRequest<UnitTransactionDocument>(
    "GET",
    `/accounts/${unitAccountId}/transactions/${unitTransactionId}`,
  );
}
