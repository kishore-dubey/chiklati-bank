-- CreateEnum
CREATE TYPE "PaymentRail" AS ENUM ('Book', 'Ach', 'Wire');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('Credit', 'Debit');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'PendingReview', 'Clearing', 'Sent', 'Rejected', 'Canceled');

-- CreateEnum
CREATE TYPE "CounterpartyAccountType" AS ENUM ('Checking', 'Savings', 'Loan');

-- CreateEnum
CREATE TYPE "CounterpartyType" AS ENUM ('Business', 'Person', 'Unknown');

-- CreateEnum
CREATE TYPE "CounterpartyPermissions" AS ENUM ('CreditOnly', 'DebitOnly', 'CreditAndDebit');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "webhook_events" ADD COLUMN     "paymentId" TEXT;

-- CreateTable
CREATE TABLE "counterparties" (
    "id" TEXT NOT NULL,
    "unitCounterpartyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "routingNumber" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountType" "CounterpartyAccountType" NOT NULL,
    "type" "CounterpartyType" NOT NULL,
    "permissions" "CounterpartyPermissions",
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counterparties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "unitPaymentId" TEXT NOT NULL,
    "rail" "PaymentRail" NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "direction" "PaymentDirection" NOT NULL DEFAULT 'Credit',
    "amount" BIGINT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "counterpartyId" TEXT,
    "counterpartySnapshot" JSONB NOT NULL,
    "tags" JSONB,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "counterparties_unitCounterpartyId_key" ON "counterparties"("unitCounterpartyId");

-- CreateIndex
CREATE INDEX "counterparties_userId_idx" ON "counterparties"("userId");

-- CreateIndex
CREATE INDEX "counterparties_customerId_idx" ON "counterparties"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_unitPaymentId_key" ON "payments"("unitPaymentId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_accountId_idx" ON "payments"("accountId");

-- CreateIndex
CREATE INDEX "payments_counterpartyId_idx" ON "payments"("counterpartyId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "counterparties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
