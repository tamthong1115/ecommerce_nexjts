import { Worker, Job } from 'bullmq';
import { handleStripeWebhook } from '@/features/payment/webhook/stripe.handle';
import { handleMomoWebhook } from '@/features/payment/webhook/momo.handle';
import { handleVNPayWebhook } from '@/features/payment/webhook/vnpay.handle';
import { PAYMENT_HOOK_QUEUE_NAME } from '@/worker/config';
import redisClient from '@/lib/redis';

export const processHookJob = async (job: Job) => {
  const { provider, eventType, payload } = job.data;

  console.log(
    `🔨 Worker đang xử lý Webhook Job ${job.id} - Provider: ${provider} - Event: ${eventType}`
  );

  try {
    switch (provider) {
      case 'STRIPE':
        await handleStripeWebhook(eventType, payload);
        break;
      case 'MOMO':
        await handleMomoWebhook(payload);
        break;
      case 'VNPAY':
        await handleVNPayWebhook(payload);
        break;
    }
    return { success: true };
  } catch (error) {
    console.error(`❌ Webhook Failed:`, error);
    throw error;
  }
};

export const initWebhookWorker = () => {
  const worker = new Worker(PAYMENT_HOOK_QUEUE_NAME, processHookJob, {
    connection: redisClient,

    concurrency: 10,

    removeOnComplete: { count: 1000, age: 7 * 24 * 3600 },
    removeOnFail: { count: 5000 },
  });

  worker.on('ready', () => {
    console.log('✅ Webhook Worker đã sẵn sàng nhận việc!');
  });

  worker.on('failed', (job, err) => {
    console.error(
      `❌ Webhook Job ${job?.id} thất bại sau các lần thử: ${err.message}`
    );
  });

  worker.on('error', (err) => {
    console.error('❌ Webhook Worker gặp lỗi kết nối Redis:', err);
  });

  return worker;
};
