import { describe, expect, it } from "vitest";
import { AccountStatus, TransactionDirection, type Account, type Transaction } from "@chiklati/db";
import {
  toAccountResponse,
  toLocalAccountStatus,
  toTransactionResponse,
} from "../src/modules/accounts/accounts.mapper.js";

const account: Account = {
  id: "acc-1",
  unitAccountId: "20309990",
  customerId: "cust-1",
  userId: "user-1",
  depositProduct: "checking",
  status: AccountStatus.Open,
  currency: "USD",
  balance: 150000n,
  hold: 2000n,
  available: 148000n,
  routingNumber: "812345678",
  accountNumber: "1017466024",
  tags: null,
  lastEventAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

const transaction: Transaction = {
  id: "txn-1",
  unitTransactionId: "999",
  accountId: "acc-1",
  type: "book",
  direction: TransactionDirection.Credit,
  amount: 5000n,
  balance: 150000n,
  summary: "Transfer",
  tags: null,
  unitCreatedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastEventAt: new Date("2026-01-01T00:00:00.000Z"),
  createdAt: new Date("2026-01-01T00:00:01.000Z"),
  updatedAt: new Date("2026-01-01T00:00:01.000Z"),
};

describe("accounts.mapper", () => {
  it("maps an Account record to the response DTO, stringifying BigInt money fields", () => {
    const result = toAccountResponse(account);

    expect(result).toEqual({
      id: "acc-1",
      unitAccountId: "20309990",
      customerId: "cust-1",
      depositProduct: "checking",
      status: "Open",
      currency: "USD",
      balance: "150000",
      hold: "2000",
      available: "148000",
      routingNumber: "812345678",
      accountNumber: "1017466024",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("maps a Transaction record to the response DTO, stringifying BigInt money fields", () => {
    const result = toTransactionResponse(transaction);

    expect(result).toEqual({
      id: "txn-1",
      unitTransactionId: "999",
      accountId: "acc-1",
      type: "book",
      direction: "Credit",
      amount: "5000",
      balance: "150000",
      summary: "Transfer",
      unitCreatedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:01.000Z",
    });
  });

  it("maps Unit's account status strings onto the local enum", () => {
    expect(toLocalAccountStatus("Open")).toBe(AccountStatus.Open);
    expect(toLocalAccountStatus("Frozen")).toBe(AccountStatus.Frozen);
    expect(toLocalAccountStatus("Closed")).toBe(AccountStatus.Closed);
  });
});
