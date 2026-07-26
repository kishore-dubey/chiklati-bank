import {
  prisma,
  type Payment,
  type PaymentDirection,
  type PaymentRail,
  type PaymentStatus,
} from "@chiklati/db";

export interface CreatePaymentRecordInput {
  unitPaymentId: string;
  rail: PaymentRail;
  accountId: string;
  userId: string;
  direction: PaymentDirection;
  amount: bigint;
  status: PaymentStatus;
  description: string;
  counterpartyId: string | null;
  counterpartySnapshot: object;
  tags: object | null;
}

export async function createPaymentRecord(input: CreatePaymentRecordInput): Promise<Payment> {
  return prisma.payment.create({
    data: {
      unitPaymentId: input.unitPaymentId,
      rail: input.rail,
      accountId: input.accountId,
      userId: input.userId,
      direction: input.direction,
      amount: input.amount,
      status: input.status,
      description: input.description,
      counterpartyId: input.counterpartyId ?? undefined,
      counterpartySnapshot: input.counterpartySnapshot,
      tags: input.tags ?? undefined,
    },
  });
}

export async function findPaymentById(id: string, userId: string): Promise<Payment | null> {
  return prisma.payment.findFirst({ where: { id, userId } });
}

export async function findPaymentByUnitPaymentId(unitPaymentId: string): Promise<Payment | null> {
  return prisma.payment.findUnique({ where: { unitPaymentId } });
}

export async function findPaymentsForUser(userId: string, accountId?: string): Promise<Payment[]> {
  return prisma.payment.findMany({
    where: { userId, ...(accountId ? { accountId } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function applyPaymentStatusUpdate(
  unitPaymentId: string,
  newStatus: PaymentStatus,
  eventCreatedAt: Date,
): Promise<{ paymentId?: string; applied: boolean }> {
  const payment = await findPaymentByUnitPaymentId(unitPaymentId);

  if (!payment) {
    return { applied: false };
  }

  const result = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      OR: [{ lastEventAt: null }, { lastEventAt: { lt: eventCreatedAt } }],
    },
    data: { status: newStatus, lastEventAt: eventCreatedAt },
  });

  return { paymentId: payment.id, applied: result.count > 0 };
}
