import {
  prisma,
  type Counterparty,
  type CounterpartyAccountType,
  type CounterpartyPermissions,
  type CounterpartyType,
} from "@chiklati/db";

export interface CreateCounterpartyRecordInput {
  unitCounterpartyId: string;
  customerId: string;
  userId: string;
  name: string;
  routingNumber: string;
  accountNumber: string;
  accountType: CounterpartyAccountType;
  type: CounterpartyType;
  permissions: CounterpartyPermissions | null;
  tags: object | null;
}

export async function createCounterpartyRecord(
  input: CreateCounterpartyRecordInput,
): Promise<Counterparty> {
  return prisma.counterparty.create({
    data: {
      unitCounterpartyId: input.unitCounterpartyId,
      customerId: input.customerId,
      userId: input.userId,
      name: input.name,
      routingNumber: input.routingNumber,
      accountNumber: input.accountNumber,
      accountType: input.accountType,
      type: input.type,
      permissions: input.permissions ?? undefined,
      tags: input.tags ?? undefined,
    },
  });
}

export async function findCounterpartyById(id: string, userId: string): Promise<Counterparty | null> {
  return prisma.counterparty.findFirst({ where: { id, userId } });
}

export async function findCounterpartiesForUser(
  userId: string,
  customerId?: string,
): Promise<Counterparty[]> {
  return prisma.counterparty.findMany({
    where: { userId, ...(customerId ? { customerId } : {}) },
    orderBy: { createdAt: "desc" },
  });
}
