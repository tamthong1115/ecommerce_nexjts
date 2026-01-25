import { Queue } from 'bullmq';
import { connection } from '@/lib/queue/ioredis-connection';
import { NotificationPayload } from '@/features/notification/types/notification.type';

export const NOTIFICATION_QUEUE_NAME = 'notification-queue';

export const notificationQueue = new Queue<NotificationPayload>(
  NOTIFICATION_QUEUE_NAME,
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  }
);
