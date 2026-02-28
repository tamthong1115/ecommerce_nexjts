import { Worker } from 'bullmq';
import { connection } from '@/lib/queue/ioredis-connection';
import { notificationDispatcher } from '@/features/notification/server/queue/notification.dispatcher';
import { NotificationPayload } from '@/features/notification/types/notification.type';
import dotenv from 'dotenv';

dotenv.config();

const NOTIFICATION_QUEUE_NAME = 'notification-queue';

console.log('[Worker] Starting notification notificationWorker...');

const notificationWorker = new Worker<NotificationPayload>(
  NOTIFICATION_QUEUE_NAME,
  async (job) => {
    console.log(`[Worker] Processing job ${job.id}:`, job.name);
    try {
      await notificationDispatcher.notify(job.data);
      console.log(`[Worker] Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`[Worker] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

notificationWorker.on('completed', (job) => {
  console.log(`[Notification Worker] Job ${job.id} has completed!`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(
    `[Notification Worker] Job ${job?.id} has failed with ${err.message}`
  );
});

notificationWorker.on('error', (err) => {
  console.error('[Notification Worker] Worker error:', err);
});

console.log(
  '[Notification Worker] Notification notificationWorker is ready and listening for jobs.'
);
