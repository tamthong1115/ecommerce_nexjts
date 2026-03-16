import { initPaymentWorker } from '@/worker/payment.worker';
import { initWebhookWorker } from '@/worker/payment_hook.worker';

const workerType = process.argv[2];

async function startWorkers() {
  console.log(`🚀 Starting Worker Process...`);

  switch (workerType) {
    case 'payment':
      console.log('hit payment');
      initPaymentWorker();
      console.log('✅ Payment Worker Started (Standalone)');
      break;

    case 'webhook':
      console.log('hit webhook');
      initWebhookWorker();
      console.log('✅ Webhook Worker Started (Standalone)');
      break;

    default:
      console.log('hit all');
      initPaymentWorker();
      initWebhookWorker();
      console.log('✅ ALL Workers Started (Combined)');
      break;
  }
}

startWorkers().catch((err) => {
  console.error('Fatal Error starting workers:', err);
  process.exit(1);
});
