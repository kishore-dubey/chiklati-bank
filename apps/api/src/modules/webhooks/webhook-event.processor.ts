import { ApplicationStatus, CustomerStatus, CustomerType, WebhookEventStatus, prisma } from "@chiklati/db";
import { logger } from "../../lib/logger.js";
import { handleAccountEvent } from "./account-event.handler.js";
import { handleTransactionCreated, handleTransactionUpdated } from "./transaction-event.handler.js";
import { getEventCreatedAt, getRelationshipId } from "./webhook-event.utils.js";
import type { IncomingUnitEvent } from "./webhooks.service.js";

const APPLICATION_STATUS_EVENTS: Record<string, ApplicationStatus> = {
  "application.awaitingDocuments": ApplicationStatus.AwaitingDocuments,
  "application.pendingReview": ApplicationStatus.PendingReview,
  "application.approved": ApplicationStatus.Approved,
  "application.denied": ApplicationStatus.Denied,
  "application.canceled": ApplicationStatus.Canceled,
};

interface MarkEventOptions {
  applicationId?: string;
  accountId?: string;
  error?: string;
}

async function markEvent(
  webhookEventId: string,
  status: WebhookEventStatus,
  options: MarkEventOptions = {},
): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: {
      status,
      processedAt: new Date(),
      ...(options.applicationId ? { applicationId: options.applicationId } : {}),
      ...(options.accountId ? { accountId: options.accountId } : {}),
      ...(options.error ? { error: options.error } : {}),
    },
  });
}

async function applyApplicationStatusUpdate(
  event: IncomingUnitEvent,
  newStatus: ApplicationStatus,
  eventCreatedAt: Date,
): Promise<{ applicationId?: string; applied: boolean }> {
  const unitApplicationId = getRelationshipId(event, "application");

  if (!unitApplicationId) {
    logger.warn({ eventType: event.type }, "application event missing application relationship");
    return { applied: false };
  }

  const application = await prisma.application.findUnique({ where: { unitApplicationId } });

  if (!application) {
    logger.warn({ unitApplicationId, eventType: event.type }, "webhook event for unknown application");
    return { applied: false };
  }

  const result = await prisma.application.updateMany({
    where: {
      id: application.id,
      OR: [{ lastEventAt: null }, { lastEventAt: { lt: eventCreatedAt } }],
    },
    data: { status: newStatus, lastEventAt: eventCreatedAt },
  });

  return { applicationId: application.id, applied: result.count > 0 };
}

async function upsertCustomerFromApprovedEvent(
  event: IncomingUnitEvent,
  applicationId: string,
  eventCreatedAt: Date,
): Promise<void> {
  const unitCustomerId = getRelationshipId(event, "customer");

  if (!unitCustomerId) {
    logger.warn({ applicationId }, "application.approved event missing customer relationship");
    return;
  }

  const application = await prisma.application.findUnique({ where: { id: applicationId } });

  if (!application) {
    return;
  }

  const customerType = application.type === "Individual" ? CustomerType.Individual : CustomerType.Business;

  await prisma.customer.upsert({
    where: { unitCustomerId },
    create: {
      unitCustomerId,
      type: customerType,
      status: CustomerStatus.Active,
      applicationId,
      userId: application.userId,
      lastEventAt: eventCreatedAt,
    },
    update: { lastEventAt: eventCreatedAt },
  });
}

async function applyCustomerStatusUpdate(
  event: IncomingUnitEvent,
  newStatus: CustomerStatus,
  eventCreatedAt: Date,
): Promise<void> {
  const unitCustomerId = getRelationshipId(event, "customer");

  if (!unitCustomerId) {
    logger.warn({ eventType: event.type }, "customer event missing customer relationship");
    return;
  }

  await prisma.customer.updateMany({
    where: {
      unitCustomerId,
      OR: [{ lastEventAt: null }, { lastEventAt: { lt: eventCreatedAt } }],
    },
    data: { status: newStatus, lastEventAt: eventCreatedAt },
  });
}

export async function processWebhookEvent(webhookEventId: string): Promise<void> {
  const row = await prisma.webhookEvent.findUnique({ where: { id: webhookEventId } });

  if (!row) {
    logger.warn({ webhookEventId }, "webhook event row not found, skipping");
    return;
  }

  // Only terminal successful states are skipped -- Pending (first attempt) and
  // Failed (BullMQ retry) both fall through to reprocessing.
  if (row.status === WebhookEventStatus.Processed || row.status === WebhookEventStatus.Skipped) {
    return;
  }

  const event = row.payload as unknown as IncomingUnitEvent;
  const eventCreatedAt = getEventCreatedAt(event);

  try {
    if (event.type === "application.created") {
      const unitApplicationId = getRelationshipId(event, "application");
      const application = unitApplicationId
        ? await prisma.application.findUnique({ where: { unitApplicationId } })
        : null;
      await markEvent(webhookEventId, WebhookEventStatus.Processed, { applicationId: application?.id });
      return;
    }

    const applicationStatus = APPLICATION_STATUS_EVENTS[event.type];
    if (applicationStatus) {
      const { applicationId, applied } = await applyApplicationStatusUpdate(
        event,
        applicationStatus,
        eventCreatedAt,
      );

      if (!applied) {
        await markEvent(webhookEventId, WebhookEventStatus.Skipped, { applicationId });
        return;
      }

      if (event.type === "application.approved" && applicationId) {
        await upsertCustomerFromApprovedEvent(event, applicationId, eventCreatedAt);
      }

      await markEvent(webhookEventId, WebhookEventStatus.Processed, { applicationId });
      return;
    }

    if (event.type === "customer.created" || event.type === "customer.updated") {
      await applyCustomerStatusUpdate(event, CustomerStatus.Active, eventCreatedAt);
      await markEvent(webhookEventId, WebhookEventStatus.Processed);
      return;
    }

    if (event.type === "customer.archived") {
      await applyCustomerStatusUpdate(event, CustomerStatus.Archived, eventCreatedAt);
      await markEvent(webhookEventId, WebhookEventStatus.Processed);
      return;
    }

    if (event.type.startsWith("account.")) {
      const { accountId, applied } = await handleAccountEvent(event, eventCreatedAt);
      await markEvent(webhookEventId, applied ? WebhookEventStatus.Processed : WebhookEventStatus.Skipped, {
        accountId,
      });
      return;
    }

    if (event.type === "transaction.created") {
      const { accountId, applied } = await handleTransactionCreated(event, eventCreatedAt);
      await markEvent(webhookEventId, applied ? WebhookEventStatus.Processed : WebhookEventStatus.Skipped, {
        accountId,
      });
      return;
    }

    if (event.type === "transaction.updated") {
      await handleTransactionUpdated(event, eventCreatedAt);
      await markEvent(webhookEventId, WebhookEventStatus.Processed);
      return;
    }

    // document.* and any other/future event types: acknowledged, no local
    // mutation modeled yet -- per CLAUDE.md, new event types must not break
    // the listener.
    await markEvent(webhookEventId, WebhookEventStatus.Processed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markEvent(webhookEventId, WebhookEventStatus.Failed, { error: message });
    throw error;
  }
}
