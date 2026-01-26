import { prisma } from '@/lib/db';
import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import PaymentStatus = $Enums.PaymentStatus;
import { customerPaidOrderSuccessUsecase } from '@/features/payment_transaction/payment_transaction.usecases';
import { StockManager } from '@/lib/stock-manager';
import 'dotenv/config';

export async function handleVNPayWebhook(vnpParams: Record<string, string>) {
  const rspCode = vnpParams['vnp_ResponseCode'];
  const txnRef = vnpParams['vnp_TxnRef']; // Đây là OrderId (externalId)
  const vnpTransactionNo = vnpParams['vnp_TransactionNo'];

  // 1. Tìm Payment Record
  const payment = await prisma.payment.findFirst({
    where: {
      externalId: txnRef,
      provider: PaymentProvider.VNPAY,
    },
    include: {
      orders: {
        include: { order: { include: { items: true } } },
      },
    },
  });

  if (!payment) {
    throw new Error(`VNPay Payment not found for Ref: ${txnRef}`);
  }

  // 2. Idempotency Check
  if (payment.status !== PaymentStatus.PENDING) {
    console.log(`⚠️ VNPay Payment ${txnRef} đã được xử lý trước đó.`);
    return;
  }

  const orderDetails = payment.orders.map((op) => op.order);
  const orderIds = orderDetails.map((o) => o.id);

  // === TRƯỜNG HỢP THÀNH CÔNG (00) ===
  if (rspCode === '00') {
    await prisma.$transaction(async (tx) => {
      // Update Payment
      const updateResult = await tx.payment.updateMany({
        where: { id: payment.id, status: $Enums.PaymentStatus.PENDING },
        data: {
          status: $Enums.PaymentStatus.PAID,
          rawPayload: vnpParams,
          updatedAt: new Date(),
        },
      });

      if (updateResult.count === 0) return;

      // Update Intent
      await tx.paymentIntent.updateMany({
        where: { gatewayRef: txnRef },
        data: { status: $Enums.IntentStatus.SUCCEEDED },
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

      // Logic User Success (Hoa hồng...)
      for (const order of orderDetails) {
        try {
          await customerPaidOrderSuccessUsecase(
            tx,
            order.shopId!,
            order.grandTotal,
            order.id,
            payment.id,
            vnpTransactionNo
          );
        } catch (e) {
          console.error(`Lỗi cộng tiền ví cho order ${order.id}:`, e);
          throw e; // Throw để rollback transaction nếu logic tiền nong quan trọng
        }
      }
    });
    console.log(`✅ VNPay Payment ${txnRef} Success!`);
  }

  // === TRƯỜNG HỢP THẤT BẠI (Rollback) ===
  else {
    console.log(
      `❌ VNPay Payment ${txnRef} Failed (Code: ${rspCode}). Rolling back...`
    );

    // 1. Update DB Failed
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', updatedAt: new Date() },
      });

      await tx.paymentIntent.updateMany({
        where: { gatewayRef: txnRef },
        data: { status: $Enums.IntentStatus.FAILED },
      });

      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { paymentStatus: 'FAILED', status: 'CANCELED' },
      });

      // 2. HOÀN KHO DATABASE
      for (const order of orderDetails) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId! },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });

    // 3. HOÀN KHO REDIS
    for (const order of orderDetails) {
      for (const item of order.items) {
        await StockManager.releaseStock(item.variantId!, item.quantity);
      }
    }
    console.log('✅ VNPay Rollback Stock Success!');
  }
}
