import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AccountStatus,
  ApplicationStatus,
  ApplicationType,
  CustomerStatus,
  CustomerType,
  TransactionDirection,
  prisma,
} from "@chiklati/db";
import { applyTransactionCreated } from "../src/modules/accounts/accounts.repository.js";

describe("accounts.repository applyTransactionCreated (real local Postgres)", () => {
  let userId: string;
  let accountId: string;
  let unitAccountId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `accounts-repo-test-${randomUUID()}@example.com`, passwordHash: "unused" },
    });
    userId = user.id;

    const application = await prisma.application.create({
      data: {
        unitApplicationId: `test-app-${randomUUID()}`,
        userId,
        type: ApplicationType.Individual,
        status: ApplicationStatus.Approved,
        applicantSnapshot: { name: "Test User", email: user.email },
      },
    });

    const customer = await prisma.customer.create({
      data: {
        unitCustomerId: `test-cust-${randomUUID()}`,
        type: CustomerType.Individual,
        status: CustomerStatus.Active,
        applicationId: application.id,
        userId,
      },
    });

    unitAccountId = `test-acc-${randomUUID()}`;
    const account = await prisma.account.create({
      data: {
        unitAccountId,
        customerId: customer.id,
        userId,
        depositProduct: "checking",
        status: AccountStatus.Open,
        currency: "USD",
        balance: 0n,
        hold: 0n,
        available: 0n,
        routingNumber: "812345678",
        accountNumber: "1000000000",
      },
    });
    accountId = account.id;
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { accountId } });
    await prisma.payment.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.customer.deleteMany({ where: { userId } });
    await prisma.application.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("applies a transaction, updating balance and available", async () => {
    const result = await applyTransactionCreated({
      unitAccountId,
      unitTransactionId: `txn-${randomUUID()}`,
      type: "book",
      direction: TransactionDirection.Credit,
      amount: 5000n,
      postTransactionBalance: 5000n,
      summary: "Initial deposit",
      tags: null,
      unitCreatedAt: new Date(),
      eventCreatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(result).toEqual({ accountId, applied: true });

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    expect(account?.balance).toBe(5000n);
    expect(account?.available).toBe(5000n);
  });

  it("does not double-create a transaction for a duplicate unitTransactionId", async () => {
    const unitTransactionId = `txn-${randomUUID()}`;
    const eventCreatedAt = new Date("2026-01-02T00:00:00.000Z");

    const first = await applyTransactionCreated({
      unitAccountId,
      unitTransactionId,
      type: "book",
      direction: TransactionDirection.Credit,
      amount: 1000n,
      postTransactionBalance: 6000n,
      summary: "Dup test",
      tags: null,
      unitCreatedAt: new Date(),
      eventCreatedAt,
    });
    expect(first?.applied).toBe(true);

    const second = await applyTransactionCreated({
      unitAccountId,
      unitTransactionId,
      type: "book",
      direction: TransactionDirection.Credit,
      amount: 1000n,
      postTransactionBalance: 6000n,
      summary: "Dup test",
      tags: null,
      unitCreatedAt: new Date(),
      eventCreatedAt,
    });
    expect(second?.applied).toBe(false);

    const count = await prisma.transaction.count({ where: { unitTransactionId } });
    expect(count).toBe(1);
  });

  it("rejects an out-of-order event whose eventCreatedAt is not newer than the current lastEventAt", async () => {
    // account's lastEventAt is at 2026-01-02T00:00:00.000Z from the previous test
    const result = await applyTransactionCreated({
      unitAccountId,
      unitTransactionId: `txn-${randomUUID()}`,
      type: "book",
      direction: TransactionDirection.Credit,
      amount: 100n,
      postTransactionBalance: 999999n,
      summary: "Stale event",
      tags: null,
      unitCreatedAt: new Date(),
      eventCreatedAt: new Date("2026-01-01T12:00:00.000Z"),
    });

    expect(result?.applied).toBe(false);

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    expect(account?.balance).not.toBe(999999n);
  });

  it("serializes two concurrent transactions for the same account so the final state always reflects the later event", async () => {
    await prisma.account.update({
      where: { id: accountId },
      data: { lastEventAt: null, balance: 0n, hold: 0n, available: 0n },
    });

    const earlier = new Date("2026-02-01T00:00:00.000Z");
    const later = new Date("2026-02-01T00:00:01.000Z");

    // These two calls race for the same account's row lock. Which one's
    // SELECT ... FOR UPDATE wins is genuinely nondeterministic, so this test
    // only asserts the invariants FOR UPDATE + the lastEventAt guard
    // guarantee regardless of interleaving: the later event is NEVER
    // rejected as stale (there is no possible ordering where an
    // already-committed state is newer than "later" itself), and the final
    // account state always reflects it. The earlier event may land or be
    // correctly rejected as stale depending on which runs first -- both
    // outcomes are correct, so its `applied` result is deliberately not
    // asserted here.
    const [, resultB] = await Promise.all([
      applyTransactionCreated({
        unitAccountId,
        unitTransactionId: `txn-concurrent-a-${randomUUID()}`,
        type: "book",
        direction: TransactionDirection.Credit,
        amount: 1000n,
        postTransactionBalance: 1000n,
        summary: "Concurrent A (earlier)",
        tags: null,
        unitCreatedAt: earlier,
        eventCreatedAt: earlier,
      }),
      applyTransactionCreated({
        unitAccountId,
        unitTransactionId: `txn-concurrent-b-${randomUUID()}`,
        type: "book",
        direction: TransactionDirection.Credit,
        amount: 2000n,
        postTransactionBalance: 2000n,
        summary: "Concurrent B (later)",
        tags: null,
        unitCreatedAt: later,
        eventCreatedAt: later,
      }),
    ]);

    expect(resultB?.applied).toBe(true);

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    expect(account?.balance).toBe(2000n);
    expect(account?.lastEventAt?.toISOString()).toBe(later.toISOString());
  });

  it("links the resulting transaction to a payment when paymentId is provided", async () => {
    const payment = await prisma.payment.create({
      data: {
        unitPaymentId: `test-pay-${randomUUID()}`,
        rail: "Book",
        accountId,
        userId,
        direction: "Credit",
        amount: 1500n,
        status: "Sent",
        description: "Test payment linkage",
        counterpartySnapshot: {},
      },
    });
    const unitTransactionId = `txn-payment-${randomUUID()}`;

    const result = await applyTransactionCreated({
      unitAccountId,
      unitTransactionId,
      type: "bookTransaction",
      direction: TransactionDirection.Credit,
      amount: 1500n,
      postTransactionBalance: 3500n,
      summary: "Linked to payment",
      tags: null,
      unitCreatedAt: new Date(),
      eventCreatedAt: new Date("2026-03-01T00:00:00.000Z"),
      paymentId: payment.id,
    });

    expect(result?.applied).toBe(true);

    const transaction = await prisma.transaction.findUnique({ where: { unitTransactionId } });
    expect(transaction?.paymentId).toBe(payment.id);
  });

  it("still works when paymentId is omitted (backward compatibility)", async () => {
    const unitTransactionId = `txn-no-payment-${randomUUID()}`;

    const result = await applyTransactionCreated({
      unitAccountId,
      unitTransactionId,
      type: "book",
      direction: TransactionDirection.Credit,
      amount: 250n,
      postTransactionBalance: 3750n,
      summary: "No payment link",
      tags: null,
      unitCreatedAt: new Date(),
      eventCreatedAt: new Date("2026-03-02T00:00:00.000Z"),
    });

    expect(result?.applied).toBe(true);

    const transaction = await prisma.transaction.findUnique({ where: { unitTransactionId } });
    expect(transaction?.paymentId).toBeNull();
  });

  it("returns null for a transaction on an unknown account", async () => {
    const result = await applyTransactionCreated({
      unitAccountId: `nonexistent-${randomUUID()}`,
      unitTransactionId: `txn-${randomUUID()}`,
      type: "book",
      direction: TransactionDirection.Credit,
      amount: 100n,
      postTransactionBalance: 100n,
      summary: "Unknown account",
      tags: null,
      unitCreatedAt: new Date(),
      eventCreatedAt: new Date(),
    });

    expect(result).toBeNull();
  });
});
