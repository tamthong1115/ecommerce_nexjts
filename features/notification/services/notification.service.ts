import { GetNotificationsDTO } from '@/features/notification/types/notification.dto';
import { ServiceError } from '@/lib/service-error';
import { NotificationRole } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';

export const getNotifications = async (
  userId: string,
  options: GetNotificationsDTO
) => {
  const { role, limit, cursor, isRead, type } = options;

  const where = {
    userId,
    recipientRole: role,
    ...(isRead !== undefined ? { isRead } : {}),
    ...(type ? { type } : {}),
  };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    }),

    prisma.notification.count({
      where: { userId, recipientRole: role, isRead: false },
    }),
  ]);

  let nextCursor: string | undefined = undefined;
  if (notifications.length > limit) {
    const nextItem = notifications.pop();
    nextCursor = nextItem?.id;
  }

  return {
    data: notifications,
    nextCursor,
    unreadCount,
  };
};

export const markAsRead = async (userId: string, notificationId: string) => {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!existing) {
    throw new ServiceError('Notification not found or access denied', 404);
  }

  await prisma.notification.updateMany({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string, role: NotificationRole) => {
  await prisma.notification.updateMany({
    where: { userId, recipientRole: role, isRead: false },
    data: { isRead: true },
  });
};
