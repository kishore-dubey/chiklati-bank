import { Worker } from "bullmq";
import { redis } from "./lib/redis.js";
import { logger } from "./lib/logger.js";
import { WEBHOOK_EVENT_QUEUE_NAME, type WebhookEventJobData } from "./modules/webhooks/queue.js";
import { processWebhookEvent } from "./modules/webhooks/webhook-event.processor.js";

const worker = new Worker<WebhookEventJobData>(
  WEBHOOK_EVENT_QUEUE_NAME,
  async (job) => {
    await processWebhookEvent(job.data.webhookEventId);
  },
  { connection: redis, concurrency: 5 },
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id, webhookEventId: job.data.webhookEventId }, "webhook event processed");
});

worker.on("failed", (job, error) => {
  logger.error(
    { jobId: job?.id, webhookEventId: job?.data.webhookEventId, error: error.message },
    "webhook event processing failed",
  );
});

async function shutdown(): Promise<void> {
  logger.info("worker shutting down");
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

logger.info("webhook event worker started");
