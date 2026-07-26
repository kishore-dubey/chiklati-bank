import { prisma, WebhookEventStatus } from "@chiklati/db";
import { webhookEventQueue, type WebhookEventJobData } from "./queue.js";

export interface IncomingUnitEvent {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data: { type: string; id: string } | null }>;
}

export async function ingestWebhookEvents(events: IncomingUnitEvent[]): Promise<number> {
  if (events.length === 0) {
    return 0;
  }

  await prisma.webhookEvent.createMany({
    data: events.map((event) => ({
      unitEventId: event.id,
      type: event.type,
      payload: event as unknown as object,
      status: WebhookEventStatus.Pending,
    })),
    skipDuplicates: true,
  });

  const rows = await prisma.webhookEvent.findMany({
    where: { unitEventId: { in: events.map((event) => event.id) } },
    select: { id: true, status: true },
  });

  const jobs = rows
    .filter((row) => row.status === WebhookEventStatus.Pending)
    .map((row) => ({
      name: "process",
      data: { webhookEventId: row.id } satisfies WebhookEventJobData,
    }));

  if (jobs.length > 0) {
    await webhookEventQueue.addBulk(jobs);
  }

  return jobs.length;
}
