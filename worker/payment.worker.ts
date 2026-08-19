import { Worker, Job } from 'bullmq';
import { redisClient } from '@/lib/redis';
import { PAYMENT_QUEUE_NAME } from './config';
import 'dotenv/config';
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
  draftItems: any[];
  currency: Currency;
  method: string;
}

const processPaymentJob = async (job: Job<PaymentJobData>) => {
  const { provider, intentId, orderIds, amount, idempotencyKey, currency } =
    job.data;

  console.log(`🔨 Worker đang xử lý Job ${job.id} - Provider: ${provider}`);

  try {
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
    console.log(`✅ Job ${job.id} Success. URL: ${result.url}`);
    return { success: true, url: result.url };
  } catch (error) {
    console.error(`❌ Job ${job.id} Failed:`, error);
    throw error;
  }
};

// Hàm khởi tạo Worker
export const initPaymentWorker = () => {
  const worker = new Worker(PAYMENT_QUEUE_NAME, processPaymentJob, {
    connection: redisClient,
    concurrency: 10,
    removeOnComplete: { count: 1000, age: 24 * 3600 }, // Giữ 1000 job thành công trong 24h
    removeOnFail: { count: 5000 }, // Giữ nhiều job lỗi hơn để debug
  });

  worker.on('failed', async (job, err) => {
    console.error(`Job ${job?.id} thất bại sau các lần thử: ${err.message}`);
    if (job && job.data.draftItems) {
      console.log('Đang thực hiện Rollback kho (Hoàn trả tồn kho)...');

      const { draftItems } = job.data;

      try {
        // Thực hiện transaction cộng lại kho
        await prisma.$transaction(
          draftItems.map((item: any) =>
            prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            })
          )
        );
        console.log('Rollback kho thành công!');
      } catch (rollbackError) {
        console.error(
          'Rollback kho thất bại! Cần check database thủ công.',
          rollbackError
        );
      }
    }
  });

  console.log('✅ Payment Worker đã sẵn sàng!');
  return worker;
};
