// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/redis', () => ({ redisClient: { duplicate: vi.fn() } }));
vi.mock('@/lib/db', () => ({ prisma: {} }));
vi.mock('@/lib/stock-manager', () => ({ StockManager: {} }));
vi.mock('@/features/payment/strategy/payment.factory', () => ({}));
vi.mock('@/features/payment/services/payment_intent.service', () => ({}));
vi.mock('@/features/payment/payment.usecases', () => ({}));

import { isFinalAttempt } from './payment.worker';

describe('isFinalAttempt', () => {
  const job = (attemptsMade: number, attempts?: number) =>
    ({ attemptsMade, opts: { attempts } }) as any;

  it('is false while retries remain', () => {
    expect(isFinalAttempt(job(1, 3))).toBe(false);
    expect(isFinalAttempt(job(2, 3))).toBe(false);
  });

  it('is true on the last attempt', () => {
    expect(isFinalAttempt(job(3, 3))).toBe(true);
  });

  it('treats a job without attempts as single-shot', () => {
    expect(isFinalAttempt(job(1))).toBe(true);
  });
});
