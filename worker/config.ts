import { Queue, JobsOptions } from 'bullmq';
import { redisClient } from '@/lib/redis';

export const PAYMENT_QUEUE_NAME = 'payment-queue';
export const PAYMENT_HOOK_QUEUE_NAME = 'payment-hook-queue';
export const NOTIFICATION_QUEUE_NAME = 'notification-queue';
export const CRON_QUEUE_NAME = 'cron-queue';

// Own connection per Queue/Worker so blocking commands never share a socket with app cache calls.
export const newConnection = () => redisClient.duplicate() as any;

const retry = (attempts: number, delay: number): JobsOptions => ({
  attempts,
  backoff: { type: 'exponential', delay },
});

// Retention lives here: Worker options ignore removeOnComplete/removeOnFail.
export const DEFAULT_JOB_OPTIONS = {
  [PAYMENT_QUEUE_NAME]: {
    ...retry(3, 1000),
    removeOnComplete: { count: 1000, age: 24 * 3600 },
    removeOnFail: { count: 5000 },
  },
  [PAYMENT_HOOK_QUEUE_NAME]: {
    ...retry(5, 2000),
    removeOnComplete: { count: 1000, age: 7 * 24 * 3600 },
    removeOnFail: { count: 5000 },
  },
  [NOTIFICATION_QUEUE_NAME]: {
    ...retry(3, 1000),
    removeOnComplete: { count: 1000, age: 24 * 3600 },
    removeOnFail: { count: 5000, age: 7 * 24 * 3600 },
  },
  [CRON_QUEUE_NAME]: {
    ...retry(3, 5000),
    removeOnComplete: { count: 100, age: 24 * 3600 },
    removeOnFail: { count: 500 },
  },
} satisfies Record<string, JobsOptions>;

const instances = new Map<string, Queue>();

export const getQueue = <T = any>(name: keyof typeof DEFAULT_JOB_OPTIONS) => {
  let queue = instances.get(name);
  if (!queue) {
    queue = new Queue(name, {
      connection: newConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS[name],
    });
    instances.set(name, queue);
  }
  return queue as Queue<T>;
};

export const paymentQueue = () => getQueue(PAYMENT_QUEUE_NAME);
export const paymentHookQueue = () => getQueue(PAYMENT_HOOK_QUEUE_NAME);
export const cronQueue = () => getQueue(CRON_QUEUE_NAME);

export const closeQueues = () =>
  Promise.all([...instances.values()].map((q) => q.close()));
