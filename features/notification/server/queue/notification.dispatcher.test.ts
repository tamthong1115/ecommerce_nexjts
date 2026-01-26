// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationDispatcher } from './notification.dispatcher';
import {
  ChannelType,
  INotificationSender,
  NotificationPayload,
} from '../../types/notification.type';
import { NotificationRole, NotificationType } from '@/lib/generated/prisma';

// Mock the dependencies that cause side-effects
vi.mock('@/features/notification/server/email/email.factory', () => ({
  EmailProviderFactory: {
    getProvider: vi.fn(() => ({
      sendEmail: vi.fn(),
    })),
  },
}));

// Mock sender implementation
class MockSender implements INotificationSender {
  channel: ChannelType;
  supports = vi.fn();
  send = vi.fn();

  constructor(channel: ChannelType) {
    this.channel = channel;
  }
}

describe('NotificationDispatcher', () => {
  let dispatcher: NotificationDispatcher;
  let emailSender: MockSender;
  let inAppSender: MockSender;

  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    
    emailSender = new MockSender(ChannelType.EMAIL);
    inAppSender = new MockSender(ChannelType.IN_APP);
    dispatcher = new NotificationDispatcher([emailSender, inAppSender]);
  });

  const basePayload: NotificationPayload = {
    to: 'user-123',
    recipientRole: NotificationRole.BUYER, // Using actual enum
    type: NotificationType.SYSTEM, // Using actual enum
    body: 'Test notification',
  };

  it('should send to all supported senders', async () => {
    // Setup
    emailSender.supports.mockReturnValue(true);
    inAppSender.supports.mockReturnValue(true);
    emailSender.send.mockResolvedValue(undefined);
    inAppSender.send.mockResolvedValue(undefined);

    // Execute
    await dispatcher.notify(basePayload);

    // Assert
    expect(emailSender.send).toHaveBeenCalledWith(basePayload);
    expect(inAppSender.send).toHaveBeenCalledWith(basePayload);
  });

  it('should filter senders based on support', async () => {
    // Setup - Only Email supports this
    emailSender.supports.mockReturnValue(true);
    inAppSender.supports.mockReturnValue(false);

    // Execute
    await dispatcher.notify(basePayload);

    // Assert
    expect(emailSender.send).toHaveBeenCalled();
    expect(inAppSender.send).not.toHaveBeenCalled();
  });

  it('should filter senders based on requested channels', async () => {
    // Setup - Both support it
    emailSender.supports.mockReturnValue(true);
    inAppSender.supports.mockReturnValue(true);

    // Execute - Request only EMAIL
    await dispatcher.notify({
        ...basePayload,
        channels: [ChannelType.EMAIL]
    });

    // Assert
    expect(emailSender.send).toHaveBeenCalled();
    expect(inAppSender.send).not.toHaveBeenCalled();
  });

  it('should not fail completely if one sender fails', async () => {
    // Setup
    emailSender.supports.mockReturnValue(true);
    inAppSender.supports.mockReturnValue(true);
    
    // Email fails, InApp succeeds
    const error = new Error('SMTP Error');
    emailSender.send.mockRejectedValue(error);
    inAppSender.send.mockResolvedValue(undefined);

    // Execute
    await dispatcher.notify(basePayload);

    // Assert
    expect(emailSender.send).toHaveBeenCalled();
    expect(inAppSender.send).toHaveBeenCalled(); 
    // Should not throw
  });
});
