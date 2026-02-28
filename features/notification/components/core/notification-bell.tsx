'use client';

import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NotificationRole } from '@/lib/generated/prisma';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { NotificationItemDTO } from '@/features/notification/types/notification.dto';
import { useNotifications } from '@/features/notification/hooks/use-notifications';

interface NotificationBellProps {
  role: NotificationRole;
  className?: string;
}

export function NotificationBell({ role, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    markAsRead,
  } = useNotifications(role);

  const handleItemClick = (notification: (typeof notifications)[0]) => {
    markAsRead(notification.id);

    // redirect based on reference type
    // if (notification.referenceType === 'ORDER') router.push(`/orders/${notification.referenceId}`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('relative', className)}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 sm:w-96" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>
        <Separator />

        {/* List Content */}
        <ScrollArea className="h-[400px]">
          <div className="flex flex-col">
            {isLoading && notifications.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Bell className="h-8 w-8 opacity-20" />
                <span className="text-sm">No notifications yet</span>
              </div>
            ) : (
              notifications.map((n: NotificationItemDTO) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={cn(
                    'flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 focus:outline-none',
                    !n.isRead
                      ? 'bg-blue-50/40 dark:bg-blue-900/10'
                      : 'bg-background'
                  )}
                >
                  <div className="flex w-full justify-between gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium leading-none',
                        !n.isRead && 'text-primary'
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {/* Requires date-fns, or use new Date(n.createdAt).toLocaleDateString() */}
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {n.body}
                  </p>

                  {/* Navigation */}
                  {!n.isRead && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      Unread
                    </div>
                  )}
                </button>
              ))
            )}

            {/* Load More Trigger */}
            {hasNextPage && (
              <div className="p-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : null}
                  Load previous notifications
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
