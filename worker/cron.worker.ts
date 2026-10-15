import { Worker, Job } from 'bullmq';
import { prisma } from '@/lib/db';
import { $Enums } from '@/lib/generated/prisma';
import { StockManager } from '@/lib/stock-manager';
import { syncCurrencyRate } from '@/lib/sync-currency-rate';
import { paySettleQueueUsecase } from '@/features/payment_transaction/payment_transaction.usecases';
import { CRON_QUEUE_NAME, cronQueue, newConnection } from './config';

export const CRON_JOBS = {
  PROCESS_SETTLEMENT: 'process-settlement-queue',
  CLEANUP_EXPIRED_ORDERS: 'cleanup-expired-orders',
  SYNC_CURRENCY_RATES: 'sync-currency-rates',
} as const;

const SCHEDULES: Record<string, string> = {
  [CRON_JOBS.PROCESS_SETTLEMENT]: '0 0 * * *', // daily 00:00
  [CRON_JOBS.CLEANUP_EXPIRED_ORDERS]: '*/30 * * * *', // every 30 min
  [CRON_JOBS.SYNC_CURRENCY_RATES]: '0 */6 * * *', // every 6h
};

const ORDER_EXPIRY_MS = 24 * 60 * 60 * 1000;
const CLEANUP_BATCH = 50;

// Cancel unpaid orders older than 24h and return their stock.
async function handleCleanupExpiredOrders() {
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: {
        in: [$Enums.OrderStatus.PENDING, $Enums.OrderStatus.AWAITING_PAYMENT],
      },
      paymentStatus: $Enums.PaymentStatus.PENDING,
      placedAt: { lte: new Date(Date.now() - ORDER_EXPIRY_MS) },
    },
    include: { items: true },
    take: CLEANUP_BATCH,
  });

  let failed = 0;
  for (const order of expiredOrders) {
    try {
      const canceled = await prisma.$transaction(async (tx) => {
        // Status guard: a payment webhook may have landed since the read above.
        const { count } = await tx.order.updateMany({
          where: {
            id: order.id,
            status: {
              in: [
                $Enums.OrderStatus.PENDING,
                $Enums.OrderStatus.AWAITING_PAYMENT,
              ],
            },
            paymentStatus: $Enums.PaymentStatus.PENDING,
          },
          data: {
            status: $Enums.OrderStatus.CANCELED,
            paymentStatus: $Enums.PaymentStatus.FAILED,
            canceledAt: new Date(),
          },
        });
        if (count === 0) return false;

        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
        return true;
      });

      if (!canceled) continue;

      for (const item of order.items) {
        if (item.variantId) {
          await StockManager.releaseStock(item.variantId, item.quantity);
        }
      }
    } catch (err) {
      failed++;
      console.error(`[Cron] Failed to cancel order ${order.orderNumber}:`, err);
    }
  }

  // Fail the job (so BullMQ retries) only after the rest of the batch was processed.
  if (failed > 0) throw new Error(`${failed}/${expiredOrders.length} orders failed to cancel`);
}

export const processCronJob = async (job: Job) => {
  switch (job.name) {
    case CRON_JOBS.PROCESS_SETTLEMENT:
      await paySettleQueueUsecase();
      break;
    case CRON_JOBS.CLEANUP_EXPIRED_ORDERS:
      await handleCleanupExpiredOrders();
      break;
    case CRON_JOBS.SYNC_CURRENCY_RATES:
      await syncCurrencyRate();
      break;
    default:
      console.warn(`[Cron] Unknown job: ${job.name}`);
  }
  return { success: true };
};

// Register schedules and drop stale repeatables left behind by changed patterns.
export const setupCronScheduler = async () => {
  const queue = cronQueue();

  for (const [name, pattern] of Object.entries(SCHEDULES)) {
    await queue.upsertJobScheduler(name, { pattern }, { name });
  }

  // Legacy repeatables registered by the old `add({ repeat })` code would double-fire.
  for (const r of await queue.getRepeatableJobs()) {
    await queue.removeRepeatableByKey(r.key);
  }

  for (const s of await queue.getJobSchedulers()) {
    if (!(s.key in SCHEDULES)) await queue.removeJobScheduler(s.key);
  }
};

export const initCronWorker = async () => {
  await setupCronScheduler();

  return new Worker(CRON_QUEUE_NAME, processCronJob, {
    connection: newConnection(),
    concurrency: 2,
  });
};
