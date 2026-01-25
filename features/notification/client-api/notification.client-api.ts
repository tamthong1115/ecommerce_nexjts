import { fetchApi } from '@/lib/client-fetch';
import {
  GetNotificationsDTO,
  NotificationItemDTO,
  NotificationMeta,
} from '../types/notification.dto';
import { paths } from '@/lib/path';

export const notificationClientApi = {
  // (Infinite Scroll)
  getAll: async (params: GetNotificationsDTO) => {
    return fetchApi<NotificationItemDTO[], NotificationMeta>(
      paths.notifications.default,
      {
        params: {
          role: params.role,
          limit: params.limit,
          cursor: params.cursor,
          isRead: params.isRead,
          type: params.type,
        },
      }
    );
  },

  markRead: async (id: string) => {
    return fetchApi<null>(paths.notifications.default, {
      method: 'PATCH',
      body: JSON.stringify({ id }),
    });
  },

  markAllRead: async (role: string) => {
    return fetchApi<null>(paths.notifications.default, {
      method: 'PATCH',
      body: JSON.stringify({ markAll: true, role }),
    });
  },
};
