import { getQueue, NOTIFICATION_QUEUE_NAME } from '@/worker/config';
import { NotificationPayload } from '@/features/notification/types/notification.type';

export { NOTIFICATION_QUEUE_NAME };

export const notificationQueue = getQueue<NotificationPayload>(
  NOTIFICATION_QUEUE_NAME
);
