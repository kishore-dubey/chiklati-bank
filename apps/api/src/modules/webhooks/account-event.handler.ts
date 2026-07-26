import { AccountStatus, prisma } from "@chiklati/db";
import { logger } from "../../lib/logger.js";
import { getAccount } from "../../lib/unit/accounts.resource.js";
import { toLocalAccountStatus } from "../accounts/accounts.mapper.js";
import {
  applyAccountStatusUpdate,
  createAccountRecord,
  findAccountByUnitAccountId,
} from "../accounts/accounts.repository.js";
import { getRelationshipId } from "./webhook-event.utils.js";
import type { IncomingUnitEvent } from "./webhooks.service.js";

const ACCOUNT_STATUS_EVENTS: Record<string, AccountStatus> = {
  "account.frozen": AccountStatus.Frozen,
  "account.unfrozen": AccountStatus.Open,
  "account.reopened": AccountStatus.Open,
  "account.closed": AccountStatus.Closed,
};

/**
 * account.created normally arrives after our own synchronous create-account
 * response already persisted the local row. This backfill is a safety net
 * for the case where Unit's create call succeeded but our own DB write
 * crashed before committing -- a permanently-missing local Account shadow
 * row is a much worse outcome than a permanently-missing Application row,
 * since it carries a real bank account/routing number and balance.
 */
async function backfillAccountFromUnit(
  unitAccountId: string,
  unitCustomerId: string | undefined,
): Promise<string | undefined> {
  if (!unitCustomerId) {
    logger.warn({ unitAccountId }, "account.created event missing customer relationship, cannot backfill");
    return undefined;
  }

  const customer = await prisma.customer.findUnique({ where: { unitCustomerId } });

  if (!customer) {
    logger.warn({ unitAccountId, unitCustomerId }, "account.created event references unknown customer");
    return undefined;
  }

  const unitDocument = await getAccount(unitAccountId);
  const attrs = unitDocument.data.attributes;

  const record = await createAccountRecord({
    unitAccountId,
    customerId: customer.id,
    userId: customer.userId,
    depositProduct: attrs.depositProduct,
    status: toLocalAccountStatus(attrs.status),
    currency: attrs.currency,
    balance: BigInt(attrs.balance),
    hold: BigInt(attrs.hold),
    available: BigInt(attrs.available),
    routingNumber: attrs.routingNumber,
    accountNumber: attrs.accountNumber,
    tags: attrs.tags ?? null,
  });

  return record.id;
}

export async function handleAccountEvent(
  event: IncomingUnitEvent,
  eventCreatedAt: Date,
): Promise<{ accountId?: string; applied: boolean }> {
  const unitAccountId = getRelationshipId(event, "account");

  if (!unitAccountId) {
    logger.warn({ eventType: event.type }, "account event missing account relationship");
    return { applied: false };
  }

  if (event.type === "account.created") {
    const existing = await findAccountByUnitAccountId(unitAccountId);
    if (existing) {
      return { accountId: existing.id, applied: true };
    }

    const unitCustomerId = getRelationshipId(event, "customer");
    const accountId = await backfillAccountFromUnit(unitAccountId, unitCustomerId);
    return { accountId, applied: true };
  }

  const newStatus = ACCOUNT_STATUS_EVENTS[event.type];
  if (newStatus) {
    return applyAccountStatusUpdate(unitAccountId, newStatus, eventCreatedAt);
  }

  // account.updated and any other/future account event types: acknowledge only.
  const existing = await findAccountByUnitAccountId(unitAccountId);
  return { accountId: existing?.id, applied: true };
}
