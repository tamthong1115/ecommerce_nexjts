// Must be first: lib/redis reads REDIS_URL at import time.
import 'dotenv/config';
import { Worker } from 'bullmq';
import { initPaymentWorker } from '@/worker/payment.worker';
import { initWebhookWorker } from '@/worker/payment_hook.worker';
import { initNotificationWorker } from '@/worker/notification.worker';
import { initCronWorker } from '@/worker/cron.worker';
import { closeQueues } from '@/worker/config';
import { redisClient } from '@/lib/redis';
import { prisma } from '@/lib/db';

const workerType = process.argv[2] || 'all';
const workers: Worker[] = [];

const log = (worker: Worker) => {
  worker.on('completed', (job) => console.log(`[${worker.name}] ${job.name} ${job.id} done`));
  worker.on('failed', (job, err) =>
    console.error(`[${worker.name}] ${job?.name} ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
  );
  worker.on('error', (err) => console.error(`[${worker.name}] error:`, err));
  workers.push(worker);
};

async function start() {
  const all = workerType === 'all';
  if (all || workerType === 'payment') log(initPaymentWorker());
  if (all || workerType === 'webhook') log(initWebhookWorker());
  if (all || workerType === 'notification') log(initNotificationWorker());
  if (all || workerType === 'cron') log(await initCronWorker());

  if (workers.length === 0) throw new Error(`Unknown worker type: ${workerType}`);
  console.log(`🚀 Workers started: ${workers.map((w) => w.name).join(', ')}`);
}

// Let in-flight jobs finish before the process exits, so a deploy never stalls them.
let stopping = false;
async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  console.log(`${signal} received, shutting down...`);
  try {
    await Promise.all(workers.map((w) => w.close()));
    await closeQueues();
    await prisma.$disconnect();
    await redisClient.quit();
  } finally {
    process.exit(0);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  console.error('Fatal Error starting workers:', err);
  process.exit(1);
});
