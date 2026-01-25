import { render } from '@react-email/components';
import { prisma_clean as prisma } from '@/lib/queue/prisma-clean';
import { EmailProviderFactory } from '@/features/notification/server/email/email.factory';
import { VerifyEmail } from '@/features/notification/components/core/email-templates/verify-email';
import { ResetPasswordEmail } from '@/features/notification/components/core/email-templates/reset-password';

import {
  ChannelType,
  INotificationSender,
  NotificationPayload,
  OtpPayload,
  PasswordResetPayload,
} from '../../types/notification.type';
import { NotificationType } from '@/lib/generated/prisma';

export class EmailSender implements INotificationSender {
  readonly channel = ChannelType.EMAIL;
  private provider = EmailProviderFactory.getProvider();

  supports(type: NotificationType): boolean {
    return (
      type !== NotificationType.SYSTEM && type !== NotificationType.MAINTENANCE
    );
  }

  async send(payload: NotificationPayload): Promise<void> {
    console.log(`[EmailSender] Processing ${payload.type} for ${payload.to}`);

    const { html, subject } = await this.renderEmailContent(payload);

    await this.provider.sendEmail({
      to: payload.to,
      subject: subject,
      html: html,
    });
  }

  private async renderEmailContent(
    payload: NotificationPayload
  ): Promise<{ html: string; subject: string }> {
    switch (payload.type) {
      case NotificationType.VERIFICATION: {
        const p = payload as OtpPayload;
        const html = await render(VerifyEmail({ otp: p.metadata.otp }));
        return {
          html,
          subject: p.subject || 'Verify your email address',
        };
      }

      case NotificationType.SECURITY: {
        // We check if the specific 'resetLink' metadata exists to determine if this is a Reset Request
        const p = payload as PasswordResetPayload;

        if (p.metadata?.resetLink) {
          const html = await render(
            ResetPasswordEmail({
              url: p.metadata.resetLink,
              userName: p.metadata.userName,
            })
          );
          return {
            html,
            subject: p.subject || 'Reset your password',
          };
        }

        return {
          html: `<p>${payload.body}</p>`,
          subject: payload.subject || 'Security Alert',
        };
      }

      default:
        return {
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>${payload.subject || 'Notification'}</h2>
              <p>${payload.body}</p>
            </div>
          `,
          subject: payload.subject || 'Notification',
        };
    }
  }
}

export class InAppSender implements INotificationSender {
  readonly channel = ChannelType.IN_APP;

  supports(type: NotificationType): boolean {
    // In-App supports all notification types except explicit system-level maintenance
    // that doesn't need to be persisted to user history.
    return type !== NotificationType.MAINTENANCE;
  }

  async send(payload: NotificationPayload): Promise<void> {
    // InApp notifications require a valid UUID for the userId.
    // If the 'to' field is an email (e.g. for OTP/Verification), we cannot save it to the DB.
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        payload.to
      );

    if (!isUuid) {
      console.log(
        `[InAppSender] Skipping notification for non-UUID recipient: ${payload.to}`
      );
      return;
    }

    const cleanMetadata: Record<string, any> = { ...payload.metadata };

    // Security: Remove sensitive OTP from database logs
    if (
      payload.type === NotificationType.VERIFICATION &&
      'otp' in cleanMetadata
    ) {
      delete cleanMetadata.otp;
    }

    await prisma.notification.create({
      data: {
        userId: payload.to,
        recipientRole: payload.recipientRole,
        type: payload.type,
        referenceId: payload.referenceId,
        referenceType: payload.referenceType,
        title: payload.subject || this.getDefaultTitle(payload.type),
        body: payload.body,
        metadata: cleanMetadata,
        isRead: false,
      },
    });
  }

  private getDefaultTitle(type: NotificationType): string {
    switch (type) {
      case NotificationType.ORDER_SHIPPED:
        return 'Order Shipped';
      case NotificationType.ORDER_DELIVERED:
        return 'Order Delivered';
      case NotificationType.SECURITY:
        return 'Security Alert';
      case NotificationType.VERIFICATION:
        return 'Verification Required';
      case NotificationType.INVENTORY_LOW:
        return 'Inventory Alert';
      default:
        return 'Notification';
    }
  }
}
