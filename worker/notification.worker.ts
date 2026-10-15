import { Worker } from 'bullmq';
import {
  notificationDispatcher,
  NotificationDeliveryError,
} from '@/features/notification/server/queue/notification.dispatcher';
import { NotificationPayload } from '@/features/notification/types/notification.type';
import { NOTIFICATION_QUEUE_NAME, newConnection } from './config';

export { NOTIFICATION_QUEUE_NAME };

export const initNotificationWorker = () =>
  new Worker<NotificationPayload>(
    NOTIFICATION_QUEUE_NAME,
    async (job) => {
      try {
        await notificationDispatcher.notify(job.data);
      } catch (err) {
        // Retry only the channels that failed, so a retry never duplicates the in-app row.
        if (err instanceof NotificationDeliveryError) {
          await job.updateData({ ...job.data, channels: err.failedChannels });
        }
        throw err;
      }
    },
    { connection: newConnection(), concurrency: 5 }
  );
