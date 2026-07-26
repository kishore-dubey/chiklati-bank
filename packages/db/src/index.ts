import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalThis.__prisma = prisma;
}

export { PrismaClient } from "@prisma/client";
export type {
  User,
  Application,
  Customer,
  Account,
  Transaction,
  Counterparty,
  Payment,
  WebhookEvent,
} from "@prisma/client";
export {
  ApplicationType,
  ApplicationStatus,
  CustomerType,
  CustomerStatus,
  AccountStatus,
  TransactionDirection,
  PaymentRail,
  PaymentDirection,
  PaymentStatus,
  CounterpartyAccountType,
  CounterpartyType,
  CounterpartyPermissions,
  WebhookEventStatus,
} from "@prisma/client";
