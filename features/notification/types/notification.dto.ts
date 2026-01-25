import { NotificationRole, NotificationType } from '@/lib/generated/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

/**
 * Validator for GET /api/notifications
 * Supports Infinite Scroll (Cursor) and Filters
 */
export const GetNotificationsSchema = z.object({
  role: z.enum(NotificationRole).default(NotificationRole.BUYER),
  limit: z.coerce.number().int().min(1).max(50).default(10),

  cursor: z.string().uuid().optional(),

  isRead: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }, z.boolean().optional()),

  type: z.enum(NotificationType).optional(),
});

/**
 * Validator for PATCH /api/notifications
 * Handles "Mark One" and "Mark All" scenarios
 */
export const UpdateNotificationSchema = z
  .object({
    id: z.string().uuid().optional(),
    markAll: z.boolean().optional(),
    role: z.enum(NotificationRole).optional(),
  })
  .refine((data) => data.id || (data.markAll && data.role), {
    message: "Either 'id' must be provided, or 'markAll' with 'role'.",
    path: ['id'],
  });

export type GetNotificationsDTO = z.infer<typeof GetNotificationsSchema>;
export type UpdateNotificationDTO = z.infer<typeof UpdateNotificationSchema>;

export interface NotificationItemDTO {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  recipientRole: NotificationRole;
  isRead: boolean;
  image: string | null;

  // Navigation props
  referenceId: string | null;
  referenceType: string | null;
  metadata: Record<string, any> | null;

  createdAt: string;
}

export type NotificationMeta = { unreadCount: number };

export type NotificationListResponse = ApiResponse<
  NotificationItemDTO[],
  { unreadCount: number }
>;
