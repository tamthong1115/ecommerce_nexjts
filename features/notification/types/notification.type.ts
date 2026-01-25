import {
  $Enums,
  NotificationRole,
  NotificationType,
} from '@/lib/generated/prisma';

export enum ChannelType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  IN_APP = 'IN_APP',
}

export interface BasePayload {
  to: string; // UserId (UUID) for InApp; Email/Phone for others
  recipientRole: NotificationRole;
  subject?: string;
  referenceId?: string;
  referenceType?: 'ORDER' | 'PRODUCT' | 'SHOP' | 'TICKET';
  channels?: ChannelType[];
}

export interface OtpPayload extends BasePayload {
  type: typeof NotificationType.VERIFICATION;
  body: string;
  metadata: {
    otp: string;
    validityInMinutes: number;
  };
}

export interface PasswordResetPayload extends BasePayload {
  type: typeof NotificationType.SECURITY;
  body: string;
  metadata: {
    userName?: string;
    resetLink: string;
    ipAddress?: string;
  };
}

export interface OrderUpdatePayload extends BasePayload {
  type:
    | typeof NotificationType.ORDER_CREATED
    | typeof NotificationType.ORDER_SHIPPED
    | typeof NotificationType.ORDER_DELIVERED;
  body: string;
  metadata: {
    orderStatus: string;
    totalAmount?: number;
    currency?: string;
  };
}

export interface ShopActivityPayload extends BasePayload {
  type:
    | typeof NotificationType.SHOP_ACTIVITY
    | typeof NotificationType.INVENTORY_LOW;
  body: string;
  metadata: {
    shopName: string;
    actionUrl?: string;
  };
}

export interface SystemPayload extends BasePayload {
  type: typeof NotificationType.SYSTEM | typeof NotificationType.MAINTENANCE;
  body: string;
  metadata?: {
    level?: 'INFO' | 'WARNING' | 'CRITICAL';
    actionUrl?: string;
  };
}

export type NotificationPayload =
  | OtpPayload
  | PasswordResetPayload
  | OrderUpdatePayload
  | ShopActivityPayload
  | SystemPayload;

export interface INotificationSender {
  readonly channel: ChannelType;
  supports(type: NotificationType): boolean;
  send(payload: NotificationPayload): Promise<void>;
}
