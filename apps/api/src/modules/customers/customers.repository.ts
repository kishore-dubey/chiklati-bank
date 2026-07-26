import { prisma, type Customer } from "@chiklati/db";

export async function findCustomersForUser(userId: string): Promise<Customer[]> {
  return prisma.customer.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function findActiveCustomerForUser(
  customerId: string,
  userId: string,
): Promise<Customer | null> {
  return prisma.customer.findFirst({ where: { id: customerId, userId, status: "Active" } });
}
