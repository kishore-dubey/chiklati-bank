import { prisma, type Card, type CardStatus, type CardType } from "@chiklati/db";

export interface CreateCardRecordInput {
  unitCardId: string;
  accountId: string;
  customerId: string;
  userId: string;
  type: CardType;
  status: CardStatus;
  last4Digits: string;
  expirationDate: string;
  tags: object | null;
}

export async function createCardRecord(input: CreateCardRecordInput): Promise<Card> {
  return prisma.card.create({
    data: {
      unitCardId: input.unitCardId,
      accountId: input.accountId,
      customerId: input.customerId,
      userId: input.userId,
      type: input.type,
      status: input.status,
      last4Digits: input.last4Digits,
      expirationDate: input.expirationDate,
      tags: input.tags ?? undefined,
    },
  });
}

export async function findCardById(id: string, userId: string): Promise<Card | null> {
  return prisma.card.findFirst({ where: { id, userId } });
}

export async function findCardByUnitCardId(unitCardId: string): Promise<Card | null> {
  return prisma.card.findUnique({ where: { unitCardId } });
}

export async function findCardsForUser(userId: string, accountId?: string): Promise<Card[]> {
  return prisma.card.findMany({
    where: { userId, ...(accountId ? { accountId } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Unconditional status write for the synchronous action path (freeze,
 * unfreeze, close, report-stolen, report-lost) -- Unit returns the new
 * status directly in the action's HTTP response, so there's no staleness
 * to guard against here. The later card.statusChanged webhook for this
 * same transition still applies cleanly through applyCardStatusUpdate's
 * lastEventAt guard below.
 */
export async function updateCardStatusById(id: string, status: CardStatus): Promise<Card> {
  return prisma.card.update({ where: { id }, data: { status } });
}

export async function applyCardStatusUpdate(
  unitCardId: string,
  newStatus: CardStatus,
  eventCreatedAt: Date,
): Promise<{ cardId?: string; applied: boolean }> {
  const card = await findCardByUnitCardId(unitCardId);

  if (!card) {
    return { applied: false };
  }

  const result = await prisma.card.updateMany({
    where: {
      id: card.id,
      OR: [{ lastEventAt: null }, { lastEventAt: { lt: eventCreatedAt } }],
    },
    data: { status: newStatus, lastEventAt: eventCreatedAt },
  });

  return { cardId: card.id, applied: result.count > 0 };
}
