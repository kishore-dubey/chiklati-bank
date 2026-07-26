import { PaymentStatus } from "@chiklati/db";
import { logger } from "../../lib/logger.js";
import { applyPaymentStatusUpdate, findPaymentByUnitPaymentId } from "../payments/payments.repository.js";
import { getRelationshipId } from "./webhook-event.utils.js";
import type { IncomingUnitEvent } from "./webhooks.service.js";

const PAYMENT_STATUS_EVENTS: Record<string, PaymentStatus> = {
  "payment.pendingReview": PaymentStatus.PendingReview,
  "payment.rejected": PaymentStatus.Rejected,
  "payment.clearing": PaymentStatus.Clearing,
  "payment.sent": PaymentStatus.Sent,
  "payment.canceled": PaymentStatus.Canceled,
};

export async function handlePaymentEvent(
  event: IncomingUnitEvent,
  eventCreatedAt: Date,
): Promise<{ paymentId?: string; applied: boolean }> {
  const unitPaymentId = getRelationshipId(event, "payment");

  if (!unitPaymentId) {
    logger.warn({ eventType: event.type }, "payment event missing payment relationship");
    return { applied: false };
  }

  if (event.type === "payment.created") {
    const existing = await findPaymentByUnitPaymentId(unitPaymentId);

    if (existing) {
      return { paymentId: existing.id, applied: true };
    }

    // payment.created backfill: normally already persisted by our own
    // synchronous create response; only reachable if that write crashed
    // after Unit's call succeeded. Unlike accounts, we don't have enough
    // context here (accountId/userId/rail/counterparty) to reconstruct the
    // local row faithfully from just the webhook -- acknowledge without
    // creating a row; a manual reconciliation job is the right fix for this
    // rare case, not a webhook-time guess.
    logger.warn({ unitPaymentId }, "payment.created event for unknown local payment, acknowledging only");
    return { applied: true };
  }

  const newStatus = PAYMENT_STATUS_EVENTS[event.type];
  if (newStatus) {
    return applyPaymentStatusUpdate(unitPaymentId, newStatus, eventCreatedAt);
  }

  // payment.updated and any other/future payment event types: acknowledge only.
  const existing = await findPaymentByUnitPaymentId(unitPaymentId);
  return { paymentId: existing?.id, applied: true };
}
