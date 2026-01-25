'use server';

import { notificationQueue } from '../queue/notification.queue';
import { NotificationPayload } from '../../types/notification.type';

/**
 * Enqueues a notification to be processed by the worker.
 * This is the entry point for sending notifications from the application.
 */
export async function sendNotification(payload: NotificationPayload) {
  try {
    await notificationQueue.add(payload.type, payload);
    return { success: true };
  } catch (error) {
    console.error('Failed to enqueue notification:', error);
    return { success: false, error: 'Failed to queue notification' };
  }
}
