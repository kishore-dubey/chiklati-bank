import { Queue } from "bullmq";
import { redis } from "../../lib/redis.js";

export const WEBHOOK_EVENT_QUEUE_NAME = "webhook-events";

export interface WebhookEventJobData {
  webhookEventId: string;
}

export const webhookEventQueue = new Queue<WebhookEventJobData>(WEBHOOK_EVENT_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 60 * 60 * 24 },
    removeOnFail: { age: 60 * 60 * 24 * 7 },
  },
});
