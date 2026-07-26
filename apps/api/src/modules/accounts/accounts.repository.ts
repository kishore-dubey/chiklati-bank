import {
  prisma,
  type Account,
  type AccountStatus,
  type Transaction,
  type TransactionDirection,
} from "@chiklati/db";

export interface CreateAccountRecordInput {
  unitAccountId: string;
  customerId: string;
  userId: string;
  depositProduct: string;
  status: AccountStatus;
  currency: string;
  balance: bigint;
  hold: bigint;
  available: bigint;
  routingNumber: string;
  accountNumber: string;
  tags: object | null;
}

export async function createAccountRecord(input: CreateAccountRecordInput): Promise<Account> {
  return prisma.account.create({
    data: {
      unitAccountId: input.unitAccountId,
      customerId: input.customerId,
      userId: input.userId,
      depositProduct: input.depositProduct,
      status: input.status,
      currency: input.currency,
      balance: input.balance,
      hold: input.hold,
      available: input.available,
      routingNumber: input.routingNumber,
      accountNumber: input.accountNumber,
      tags: input.tags ?? undefined,
    },
  });
}

export async function findAccountById(id: string, userId: string): Promise<Account | null> {
  return prisma.account.findFirst({ where: { id, userId } });
}

export async function findAccountByUnitAccountId(unitAccountId: string): Promise<Account | null> {
  return prisma.account.findUnique({ where: { unitAccountId } });
}

export async function findAccountsForUser(userId: string, customerId?: string): Promise<Account[]> {
  return prisma.account.findMany({
    where: { userId, ...(customerId ? { customerId } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function findTransactionsForAccount(accountId: string): Promise<Transaction[]> {
  return prisma.transaction.findMany({
    where: { accountId },
    orderBy: { unitCreatedAt: "desc" },
  });
}

export async function applyAccountStatusUpdate(
  unitAccountId: string,
  newStatus: AccountStatus,
  eventCreatedAt: Date,
): Promise<{ accountId?: string; applied: boolean }> {
  const account = await findAccountByUnitAccountId(unitAccountId);

  if (!account) {
    return { applied: false };
  }

  const result = await prisma.account.updateMany({
    where: {
      id: account.id,
      OR: [{ lastEventAt: null }, { lastEventAt: { lt: eventCreatedAt } }],
    },
    data: { status: newStatus, lastEventAt: eventCreatedAt },
  });

  return { accountId: account.id, applied: result.count > 0 };
}

export interface ApplyTransactionCreatedInput {
  unitAccountId: string;
  unitTransactionId: string;
  type: string;
  direction: TransactionDirection;
  amount: bigint;
  postTransactionBalance: bigint;
  summary: string;
  tags: object | null;
  unitCreatedAt: Date;
  eventCreatedAt: Date;
}

interface AccountLockRow {
  id: string;
  hold: bigint;
  lastEventAt: Date | null;
}

/**
 * Applies a transaction.created webhook to the local ledger under a
 * pessimistic row lock. Unit's payload already carries an absolute
 * post-transaction balance, so a single write is self-consistent in
 * isolation -- the lock exists to serialize concurrent webhook deliveries
 * for the SAME account (the BullMQ worker runs with concurrency > 1), so
 * that an older event's write can never commit after a newer one's. The
 * lastEventAt staleness check only reads the true latest state because it
 * happens inside the same locked transaction as the write.
 */
export async function applyTransactionCreated(
  input: ApplyTransactionCreatedInput,
): Promise<{ accountId: string; applied: boolean } | null> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<AccountLockRow[]>`
      SELECT "id", "hold", "lastEventAt" FROM "accounts"
      WHERE "unitAccountId" = ${input.unitAccountId}
      FOR UPDATE
    `;
    const account = rows[0];

    if (!account) {
      return null;
    }

    const isStale = account.lastEventAt !== null && account.lastEventAt >= input.eventCreatedAt;
    const existing = await tx.transaction.findUnique({
      where: { unitTransactionId: input.unitTransactionId },
    });

    if (isStale || existing) {
      return { accountId: account.id, applied: false };
    }

    await tx.transaction.create({
      data: {
        unitTransactionId: input.unitTransactionId,
        accountId: account.id,
        type: input.type,
        direction: input.direction,
        amount: input.amount,
        balance: input.postTransactionBalance,
        summary: input.summary,
        tags: input.tags ?? undefined,
        unitCreatedAt: input.unitCreatedAt,
        lastEventAt: input.eventCreatedAt,
      },
    });

    const newAvailable = input.postTransactionBalance - account.hold;

    await tx.$executeRaw`
      UPDATE "accounts"
      SET "balance" = ${input.postTransactionBalance},
          "available" = ${newAvailable},
          "lastEventAt" = ${input.eventCreatedAt},
          "updatedAt" = now()
      WHERE "id" = ${account.id}
    `;

    return { accountId: account.id, applied: true };
  });
}
