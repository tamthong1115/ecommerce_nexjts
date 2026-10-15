import { EmailSender, InAppSender } from './notification.senders';
import {
  ChannelType,
  INotificationSender,
  NotificationPayload,
} from '../../types/notification.type';

export class NotificationDispatcher {
  private senders: INotificationSender[];

  constructor(senders: INotificationSender[]) {
    this.senders = senders;
  }

  /**
   * Broadcasts a notification to all supported senders (Email, In-App, etc.)
   * uses Promise.allSettled to ensure one failure does not stop others.
   */
  async notify(payload: NotificationPayload): Promise<void> {
    let supportedSenders = this.senders.filter((sender) =>
      sender.supports(payload.type)
    );

    // If specific channels are requested, filter the supported senders further
    if (payload.channels && payload.channels.length > 0) {
      supportedSenders = supportedSenders.filter((sender) =>
        payload.channels!.includes(sender.channel)
      );
    }

    if (supportedSenders.length === 0) {
      console.warn(
        `[NotificationService] No senders registered for type: ${payload.type}`
      );
      return;
    }

    const results = await Promise.allSettled(
      supportedSenders.map(async (sender) => {
        const senderName = sender.constructor.name;
        try {
          await sender.send(payload);
        } catch (error) {
          console.error(
            `[NotificationService] Failed to send via ${senderName}:`,
            error
          );
          throw error;
        }
      })
    );

    const failedChannels = supportedSenders
      .filter((_, i) => results[i].status === 'rejected')
      .map((s) => s.channel);

    // Throw only after every sender ran, so the queue retries just the failed channels.
    if (failedChannels.length > 0) {
      throw new NotificationDeliveryError(payload.type, failedChannels);
    }
  }
}

export class NotificationDeliveryError extends Error {
  constructor(
    type: string,
    readonly failedChannels: ChannelType[]
  ) {
    super(`Notification ${type} failed on: ${failedChannels.join(', ')}`);
  }
}

export const notificationDispatcher = new NotificationDispatcher([
  new EmailSender(),
  new InAppSender(),
]);
