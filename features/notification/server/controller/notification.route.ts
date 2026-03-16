import { getCurrentUserId } from '@/lib/auth';
import { NextRequest } from 'next/server';
import {
  GetNotificationsSchema,
  UpdateNotificationSchema,
} from '@/features/notification/types/notification.dto';
import { ResponseFactory } from '@/lib/api-response';
import * as service from '@/features/notification/server/service/notification.service';
import { HttpStatus } from '@/types/api';

class NotificationController {
  public getNotifications = async (req: NextRequest) => {
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.error({
            message: 'Unauthorized',
            code: 401,
          })
        );
      }

      const params = Object.fromEntries(req.nextUrl.searchParams);
      const validation = GetNotificationsSchema.safeParse(params);

      if (!validation.success) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.error({
            message: 'Invalid query parameters',
            code: 400,
            errors: validation.error.flatten().fieldErrors,
          })
        );
      }

      const { data, nextCursor, unreadCount } = await service.getNotifications(
        userId,
        validation.data
      );

      return ResponseFactory.toNextResponse(
        ResponseFactory.cursorPaginated({
          data,
          nextCursor,
          meta: { unreadCount },
        })
      );
    } catch (error) {
      return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
    }
  };

  public updateNotificationStatus = async (req: NextRequest) => {
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.error({
            message: 'Unauthorized',
            code: 401,
          })
        );
      }

      const body = await req.json();
      const validation = UpdateNotificationSchema.safeParse(body);

      if (!validation.success) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.error({
            message: 'Invalid request body',
            code: 400,
            errors: validation.error.flatten().fieldErrors,
          })
        );
      }

      const { id, markAll, role } = validation.data;

      if (markAll && role) {
        await service.markAllAsRead(userId, role);
        return ResponseFactory.toNextResponse(
          ResponseFactory.success({
            message: 'All notifications marked as read',
          })
        );
      }

      if (id) {
        await service.markAsRead(userId, id);
        return ResponseFactory.toNextResponse(
          ResponseFactory.success({
            message: 'Notification marked as read',
          })
        );
      }

      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Either id or (markAll and role) must be provided',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    } catch (error) {
      return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
    }
  };
}

export const notificationController = new NotificationController();
