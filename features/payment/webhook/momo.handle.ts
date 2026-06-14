import { StockManager } from '@/lib/stock-manager';
import { $Enums } from '@/lib/generated/prisma';
import PaymentStatus = $Enums.PaymentStatus;
import { customerPaidOrderSuccessUsecase } from '@/features/payment_transaction/payment_transaction.usecases';
import 'dotenv/config';
import { prisma } from '@/lib/db';

export async function handleMomoWebhook(payload: any) {
  const { orderId, resultCode, transId, requestId } = payload;

  const payment = await prisma.payment.findFirst({
    where: {
      externalId: orderId,
      provider: $Enums.PaymentProvider.MOMO,
    },
    include: {
      orders: {
        include: {
          order: {
            include: { items: true },
          },
        },
      },
    },
  });

  if (!payment) {
    // Nếu chưa tìm thấy, throw lỗi để Queue retry (có thể do race condition)
    throw new Error(`MoMo Payment not found for OrderId: ${orderId}`);
  }

  // 2. Idempotency Check (Tránh xử lý 2 lần)
  if (payment.status !== PaymentStatus.PENDING) {
    console.log(`⚠️ MoMo Payment ${orderId} đã được xử lý trước đó.`);
    return;
  }

  const orderDetails = payment.orders.map((op) => op.order);
  const orderIds = orderDetails.map((o) => o.id);

  if (resultCode == 0 || resultCode == 9000) {
    await prisma.$transaction(async (tx) => {
      // Update Payment
      const updateResult = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: PaymentStatus.PENDING,
        },
        data: {
          status: PaymentStatus.PAID,
          updatedAt: new Date(),
        },
      });

      if (updateResult.count === 0) return;

      // Update Intent
      // Lưu ý: gatewayRef của MoMo thường là requestId hoặc orderId tùy cách bạn lưu lúc tạo
      // Ở đây giả định bạn lưu orderId vào gatewayRef
      await tx.paymentIntent.updateMany({
        where: { gatewayRef: requestId },
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

      for (const order of orderDetails) {
        await customerPaidOrderSuccessUsecase(
          tx,
          order.shopId!,
          order.grandTotal,
          order.id,
          payment.id,
          transId.toString()
        );
      }
    });
    console.log(`✅ MoMo Payment ${orderId} Success!`);
  } else {
    console.log(
      `❌ MoMo Payment ${orderId} Failed (Code: ${resultCode}). Rolling back...`
    );

    // 1. Update DB Failed
    await prisma.$transaction(async (tx) => {
      await tx.paymentIntent.updateMany({
        where: { gatewayRef: requestId },
        data: { status: $Enums.IntentStatus.FAILED },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', updatedAt: new Date() },
      });

      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELED',
        },
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

    // 3. HOÀN KHO REDIS (Bắt buộc)
    // Thực hiện ngoài transaction DB
    for (const order of orderDetails) {
      for (const item of order.items) {
        await StockManager.releaseStock(item.variantId!, item.quantity);
      }
    }
    console.log('✅ MoMo Rollback Stock Success!');
  }
}
