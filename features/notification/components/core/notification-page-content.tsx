'use client';

import { NotificationRole, NotificationType } from '@/lib/generated/prisma';
import { useNotifications } from '@/features/notification/hooks/use-notifications';
import { useState } from 'react';
import {
  Badge,
  Bell,
  CheckCheck,
  Info,
  Loader2,
  Package,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

const DEFAULT_TABS = [
  { label: 'All', value: undefined, icon: Bell },
  {
    label: 'Order Updates',
    value: NotificationType.ORDER_SHIPPED,
    icon: Package,
  },
  { label: 'Promotions', value: NotificationType.PROMOTION, icon: Tag },
  { label: 'System', value: NotificationType.SYSTEM, icon: Info },
];

const SELLER_TABS = [
  { label: 'All', value: undefined, icon: Bell },
  {
    label: 'Shop Activity',
    value: NotificationType.SHOP_ACTIVITY,
    icon: Package,
  },
  { label: 'System', value: NotificationType.SYSTEM, icon: Info },
];

interface NotificationPageContentProps {
  role: NotificationRole;
  title?: string;
  className?: string;
}

export function NotificationPageContent({
  role,
  title = 'Notifications',
  className,
}: NotificationPageContentProps) {
  const [activeType, setActiveType] = useState<NotificationType | undefined>(
    undefined
  );

  const tabs = role === NotificationRole.SELLER ? SELLER_TABS : DEFAULT_TABS;

  const {
    notifications,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    markAsRead,
    markAllAsRead,
  } = useNotifications(role, activeType);

  return (
    <div className={cn('w-full max-w-5xl mx-auto p-4 md:p-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
          <CheckCheck className="w-4 h-4 mr-2" />
          Mark all as read
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <aside className="lg:col-span-1">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveType(tab.value)}
                className={cn(
                  'flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeType === tab.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main List */}
        <main className="lg:col-span-3 space-y-4">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border rounded-lg bg-muted/5 border-dashed">
              <Bell className="h-10 w-10 mb-3 opacity-20" />
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <Card
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={cn(
                    'group relative overflow-hidden transition-all hover:shadow-md cursor-pointer border-l-4',
                    !n.isRead
                      ? 'border-l-primary bg-card'
                      : 'border-l-transparent bg-muted/20 opacity-75 hover:opacity-100'
                  )}
                >
                  <div className="flex p-4 gap-4">
                    {/* Icon/Image */}
                    <div className="shrink-0 mt-1">
                      {n.image ? (
                        <Image
                          src={n.image}
                          alt={n.title}
                          fill
                          className="h-10 w-10 rounded-full object-cover bg-muted"
                        />
                      ) : (
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full',
                            !n.isRead
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <Bell className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p
                          className={cn(
                            'text-sm font-semibold truncate',
                            !n.isRead && 'text-foreground'
                          )}
                        >
                          {n.title}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>

                      {/* Optional Tag based on Type */}
                      {n.type === NotificationType.ORDER_SHIPPED && (
                        <div className="mt-2">
                          <Badge className="text-[10px] font-normal h-5">
                            Order Shipped
                          </Badge>
                        </div>
                      )}
                      {n.type === NotificationType.ORDER_DELIVERED && (
                        <div className="mt-2">
                          <Badge className="text-[10px] font-normal h-5 bg-green-600">
                            Order Delivered
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {hasNextPage && (
                <div className="pt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full md:w-auto min-w-[150px]"
                  >
                    {isFetchingNextPage && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
