import { notificationController } from '@/features/notification/server/controller/notification.route';

export const GET = notificationController.getNotifications;
export const PATCH = notificationController.updateNotificationStatus;
