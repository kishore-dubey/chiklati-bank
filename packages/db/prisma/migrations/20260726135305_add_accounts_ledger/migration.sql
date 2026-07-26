-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('Open', 'Frozen', 'Closed');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('Credit', 'Debit');

-- AlterTable
ALTER TABLE "webhook_events" ADD COLUMN     "accountId" TEXT;

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "unitAccountId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "depositProduct" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'Open',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "balance" BIGINT NOT NULL DEFAULT 0,
    "hold" BIGINT NOT NULL DEFAULT 0,
    "available" BIGINT NOT NULL DEFAULT 0,
    "routingNumber" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "tags" JSONB,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "unitTransactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "amount" BIGINT NOT NULL,
    "balance" BIGINT NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" JSONB,
    "unitCreatedAt" TIMESTAMP(3) NOT NULL,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_unitAccountId_key" ON "accounts"("unitAccountId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "accounts_customerId_idx" ON "accounts"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_unitTransactionId_key" ON "transactions"("unitTransactionId");

-- CreateIndex
CREATE INDEX "transactions_accountId_unitCreatedAt_idx" ON "transactions"("accountId", "unitCreatedAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
