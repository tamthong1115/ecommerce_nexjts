import { Queue } from 'bullmq';
import { redisClient } from '@/lib/redis';
export const PAYMENT_QUEUE_NAME = 'payment-queue';
export const PAYMENT_HOOK_QUEUE_NAME = 'payment-hook-queue';

let paymentQueueInstance: Queue | null = null;
let paymentHookQueueInstance: Queue | null = null;

export const paymentQueue = () => {
  if (!paymentQueueInstance) {
    paymentQueueInstance = new Queue(PAYMENT_QUEUE_NAME, {
      // 2. Truyền redisClient vào tham số 'connection'
      connection: redisClient,
      defaultJobOptions: {
        attempts: 3, // Cấu hình mặc định: Thử lại 3 lần nếu lỗi
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true, // Xóa job khi xong để nhẹ Redis
        removeOnFail: 1000, // Giữ lại 1000 job lỗi để debug
      },
    });
  }
  return paymentQueueInstance;
};

export const paymentHookQueue = () => {
  if (!paymentHookQueueInstance) {
    paymentHookQueueInstance = new Queue(PAYMENT_HOOK_QUEUE_NAME, {
      connection: redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    });
  }
  return paymentHookQueueInstance;
};
