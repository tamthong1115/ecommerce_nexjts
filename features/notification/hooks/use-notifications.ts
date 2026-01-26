'use client';

import { NotificationRole, NotificationType } from '@/lib/generated/prisma';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query';
import { notificationClientApi } from '@/features/notification/client-api/notification.client-api';
import {
  NotificationItemDTO,
  NotificationListResponse,
} from '@/features/notification/types/notification.dto';

/**
 * Define centralized query keys to ensure consistent cache management.
 * Using a factory function for 'list' prevents key collisions between different roles.
 */
const notificationKeys = {
  all: ['notifications'] as const,
  list: (role: string, type?: string) =>
    [...notificationKeys.all, 'list', role, type || 'ALL'] as const,
};

/**
 * A custom hook encapsulating notification logic, including infinite scrolling
 * and optimistic UI updates for read status.
 *
 * @param role - The user context (BUYER/SELLER) used to filter notifications.
 * @param type - (Optional) Filter by notification category (e.g., ORDER_UPDATE).
 */
export const useNotifications = (
  role: NotificationRole,
  type?: NotificationType
) => {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<NotificationListResponse>({
    // Unique cache key ensures separation of data between buyer and seller views
    // and correctly refetches when the 'type' filter changes.
    queryKey: notificationKeys.list(role, type),

    // Start with an undefined cursor to fetch the initial page
    initialPageParam: undefined as string | undefined,

    queryFn: async ({ pageParam }) => {
      const res = await notificationClientApi.getAll({
        role,
        limit: 10,
        cursor: pageParam as string | undefined,
        type,
      });

      if (!res.success) {
        throw new Error('Failed to fetch notifications');
      }

      return res;
    },

    /**
     * Derives the cursor for the next page from the backend metadata.
     * Returns undefined when no further pages are available.
     */
    getNextPageParam: (lastPage) => {
      return lastPage.meta?.cursor?.nextCursor ?? undefined;
    },
  });

  // Flattens the array of pages into a single continuous list for UI rendering
  const notifications = data?.pages.flatMap((page) => page.data || []) ?? [];

  // Extracts the unread count from the most recent page (page 0)
  const unreadCount = data?.pages[0]?.meta?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationClientApi.markRead(id),

    /**
     * Optimistic Update Strategy:
     * Immediately updates the local cache to reflect the change before the server responds.
     */
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationKeys.list(role, type),
      });

      // Snapshot previous data for rollback
      const prevData = queryClient.getQueryData<
        InfiniteData<NotificationListResponse>
      >(notificationKeys.list(role, type));

      // Optimistically update cache
      queryClient.setQueryData<InfiniteData<NotificationListResponse>>(
        notificationKeys.list(role, type),
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data?.map((n: NotificationItemDTO) =>
                n.id === id ? { ...n, isRead: true } : n
              ),
              meta: {
                ...page.meta,
                unreadCount: Math.max(0, (page.meta?.unreadCount || 0) - 1),
                cursor: page.meta?.cursor,
              },
            })),
          };
        }
      );

      return { prevData };
    },

    onError: (_err, _id, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(
          notificationKeys.list(role, type),
          context.prevData
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(role, type),
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationClientApi.markAllRead(role),

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.list(role, type),
      });

      const prevData = queryClient.getQueryData<
        InfiniteData<NotificationListResponse>
      >(notificationKeys.list(role, type));

      // Optimistically set EVERYTHING to read and reset unreadCount to 0
      queryClient.setQueryData<InfiniteData<NotificationListResponse>>(
        notificationKeys.list(role, type),
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data?.map((n) => ({ ...n, isRead: true })),
              meta: {
                ...page.meta,
                unreadCount: 0,
                cursor: page.meta?.cursor,
              },
            })),
          };
        }
      );

      return { prevData };
    },

    onError: (_err, _variables, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(
          notificationKeys.list(role, type),
          context.prevData
        );
      }
    },

    onSettled: () => {
      // Invalidate ALL lists for this role (e.g., if I mark all read in "Orders", "All" should also update)
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(role).slice(0, 3), // Invalidate parent key: ['notifications', 'list', role]
      });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    markAsRead: (id: string) => markReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
  };
};
