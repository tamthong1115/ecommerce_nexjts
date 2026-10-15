import { Worker, Job } from 'bullmq';
import { redisClient } from '@/lib/redis';
import { PAYMENT_QUEUE_NAME, newConnection } from './config';
import { StockManager } from '@/lib/stock-manager';
import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import { createPaymentStrategy } from '@/features/payment/strategy/payment.factory';
import { updatePaymentIntentService } from '@/features/payment/services/payment_intent.service';
import { createCheckoutRequestUseCase } from '@/features/payment/payment.usecases';
import PaymentStatus = $Enums.PaymentStatus;
import Currency = $Enums.Currency;
import { prisma } from '@/lib/db';

interface PaymentJobData {
  //Generic payment params
  amount: number;
  orderIds: string[];
  origin: string;

  //stripe specific
  idempotencyKey?: string;
  metadata?: Record<string, string>;

  //vnpay specific
  draftId?: string;
  bankCode?: string;
  language?: string;
  ipAddr?: string;

  //local specific
  provider: PaymentProvider;
  intentId: string;
  draftItems: { variantId: string; quantity: number }[];
  currency: Currency;
  method: string;
}

const processPaymentJob = async (job: Job<PaymentJobData>) => {
  const { provider, intentId, orderIds, amount, idempotencyKey, currency } =
    job.data;

  const strategy = createPaymentStrategy(provider);
  const result = await strategy.createPaymentUrl(job.data);

  if (!result.url) throw new Error('Không tạo được Payment URL');

  await updatePaymentIntentService(intentId, {
    gatewayRef: result.externalId,
  });

  //Tạo data payment && order
  await createCheckoutRequestUseCase(prisma, {
    params: {
      provider: provider,
      method: job.data.method,
      amount: amount,
      status: PaymentStatus.PENDING,
      currency: currency,
      externalId: result.externalId,
      idempotencyKey: idempotencyKey,
      rawPayload: result.rawPayload,
    },
    orderList: orderIds,
  });

  await redisClient.setex(`payment_url:${intentId}`, 1800, result.url);
  return { success: true, url: result.url };
};

// Hàm khởi tạo Worker
export const initPaymentWorker = () => {
  const worker = new Worker(PAYMENT_QUEUE_NAME, processPaymentJob, {
    connection: newConnection(),
    concurrency: 10,
  });

  // `failed` fires on every attempt; only compensate on the last one.
  worker.on('failed', async (job) => {
    if (!job || !isFinalAttempt(job)) return;
    try {
      await rollbackDraftStock(job);
    } catch (err) {
      console.error('Stock rollback failed, check DB manually:', err);
    }
  });

  return worker;
};

// Return reserved stock (DB + Redis) once a job has exhausted its retries.
export const rollbackDraftStock = async (job: Job<PaymentJobData>) => {
  const { draftItems } = job.data;
  if (!draftItems?.length) return;

  await prisma.$transaction(
    draftItems.map((item) =>
      prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    )
  );
  for (const item of draftItems) {
    await StockManager.releaseStock(item.variantId, item.quantity);
  }
};

export const isFinalAttempt = (job: Job) =>
  job.attemptsMade >= (job.opts.attempts ?? 1);
