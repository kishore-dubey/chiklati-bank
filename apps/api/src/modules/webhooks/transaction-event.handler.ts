import { TransactionDirection, prisma } from "@chiklati/db";
import { logger } from "../../lib/logger.js";
import { getTransaction } from "../../lib/unit/accounts.resource.js";
import { applyTransactionCreated } from "../accounts/accounts.repository.js";
import { findPaymentByUnitPaymentId } from "../payments/payments.repository.js";
import { getRelationshipId } from "./webhook-event.utils.js";
import type { IncomingUnitEvent } from "./webhooks.service.js";

function toLocalDirection(direction: string): TransactionDirection {
  return direction === "Debit" ? TransactionDirection.Debit : TransactionDirection.Credit;
}

/**
 * Our webhook subscription is created with includeResources: false, so the
 * event payload only carries relationship ids, not the transaction's own
 * attributes (amount/direction/balance/summary/type). We fetch the full
 * Transaction resource from Unit rather than guess at the event payload's
 * shape -- this mirrors how account.created's backfill fetches the full
 * Account via API instead of trusting the webhook body for resource data.
 */
export async function handleTransactionCreated(
  event: IncomingUnitEvent,
  eventCreatedAt: Date,
): Promise<{ accountId?: string; applied: boolean }> {
  const unitAccountId = getRelationshipId(event, "account");
  const unitTransactionId = getRelationshipId(event, "transaction") ?? event.id;

  if (!unitAccountId) {
    logger.warn({ eventType: event.type }, "transaction event missing account relationship");
    return { applied: false };
  }

  const unitDocument = await getTransaction(unitAccountId, unitTransactionId);
  const attrs = unitDocument.data.attributes;

  // Must-verify-empirically: whether Unit's Transaction resource actually
  // includes a `payment` relationship for rail-produced transactions.
  // Resolved outside the locked section (below) to keep that critical
  // section as short as it already is -- degrades gracefully either way,
  // staying undefined/null if the relationship is absent.
  const unitPaymentId = getRelationshipId(unitDocument.data, "payment");
  const payment = unitPaymentId ? await findPaymentByUnitPaymentId(unitPaymentId) : null;

  const result = await applyTransactionCreated({
    unitAccountId,
    unitTransactionId,
    type: unitDocument.data.type,
    direction: toLocalDirection(attrs.direction),
    amount: BigInt(Math.trunc(attrs.amount)),
    postTransactionBalance: BigInt(Math.trunc(attrs.balance)),
    summary: attrs.summary,
    tags: attrs.tags ?? null,
    unitCreatedAt: new Date(attrs.createdAt),
    eventCreatedAt,
    paymentId: payment?.id,
  });

  if (!result) {
    logger.warn({ unitAccountId, unitTransactionId }, "transaction.created event for unknown account");
    return { applied: false };
  }

  return result;
}

export async function handleTransactionUpdated(event: IncomingUnitEvent, eventCreatedAt: Date): Promise<void> {
  const unitTransactionId = getRelationshipId(event, "transaction") ?? event.id;

  await prisma.transaction.updateMany({
    where: {
      unitTransactionId,
      OR: [{ lastEventAt: null }, { lastEventAt: { lt: eventCreatedAt } }],
    },
    data: { lastEventAt: eventCreatedAt },
  });
}
