import { Worker, Job } from 'bullmq';
import { handleStripeWebhook } from '@/features/payment/webhook/stripe.handle';
import { handleMomoWebhook } from '@/features/payment/webhook/momo.handle';
import { handleVNPayWebhook } from '@/features/payment/webhook/vnpay.handle';
import { PAYMENT_HOOK_QUEUE_NAME, newConnection } from '@/worker/config';

export const processHookJob = async (job: Job) => {
  const { provider, eventType, payload } = job.data;

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
    default:
      throw new Error(`Unknown webhook provider: ${provider}`);
  }
  return { success: true };
};

export const initWebhookWorker = () =>
  new Worker(PAYMENT_HOOK_QUEUE_NAME, processHookJob, {
    connection: newConnection(),
    concurrency: 10,
  });
