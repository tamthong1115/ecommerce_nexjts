import { NotificationPageContent } from '@/features/notification/components/core/notification-page-content';
import { NotificationRole } from '@/lib/generated/prisma';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications | Account',
  description: 'View your order updates and account notifications',
};

export default function NotificationsPage() {
  return (
    <NotificationPageContent
      role={NotificationRole.BUYER}
      title="My Notifications"
    />
  );
}
