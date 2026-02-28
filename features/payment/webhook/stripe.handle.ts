import { prisma } from '@/lib/db';
import { $Enums } from '@/lib/generated/prisma';
import { StockManager } from '@/lib/stock-manager';
import { customerPaidOrderSuccessUsecase } from '@/features/payment_transaction/payment_transaction.usecases';
import IntentStatus = $Enums.IntentStatus;
import 'dotenv/config';

export async function handleStripeWebhook(eventType: string, session: any) {
  // 2. Tìm Payment Record
  const payment = await prisma.payment.findUnique({
    where: {
      provider_externalId: {
        externalId: session.id,
        provider: $Enums.PaymentProvider.STRIPE,
      },
    },
    include: {
      orders: {
        include: { order: { include: { items: true } } },
      },
    },
  });

  if (!payment) {
    throw new Error('Payment not found in DB yet (Stripe)');
  }

  // Idempotency Check
  if (payment.status === 'PAID' || payment.status === 'FAILED') {
    return;
  }

  const orderIds = payment.orders.map((op) => op.id);

  // --- CASE THÀNH CÔNG ---
  if (eventType === 'checkout.session.completed') {
    await prisma.$transaction(async (tx) => {
      // Update Payment
      await tx.payment.update({
        where: { id: payment.id, status: 'PENDING' },
        data: { status: 'PAID', updatedAt: new Date() },
      });

      // Update Intent
      await tx.paymentIntent.updateMany({
        where: { gatewayRef: session.id },
        data: { status: IntentStatus.SUCCEEDED },
      });

      // Update Orders
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          updatedAt: new Date(),
        },
      });

      // Logic User Success (Hoa hồng, v.v.)
      for (const od of payment.orders) {
        await customerPaidOrderSuccessUsecase(
          tx,
          od.order.shopId!,
          od.order.grandTotal,
          od.order.id,
          payment.id,
          session.payment_intent
        );
      }
    });
    console.log('✅ Stripe Handler: Success Processed!');
  }

  // --- CASE THẤT BẠI / HẾT HẠN (Rollback) ---
  else if (
    eventType === 'checkout.session.expired' ||
    eventType === 'payment_intent.payment_failed'
  ) {
    console.log('❌ Stripe Handler: Failed/Expired. Rolling back...');

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      await tx.paymentIntent.updateMany({
        where: { gatewayRef: session.id },
        data: { status: $Enums.IntentStatus.EXPIRED },
      });

      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { paymentStatus: 'FAILED', status: 'CANCELED' },
      });

      for (const od of payment.orders) {
        for (const item of od.order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId! },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });

    for (const od of payment.orders) {
      for (const item of od.order.items) {
        await StockManager.releaseStock(item.variantId!, item.quantity);
      }
    }
  }
}
