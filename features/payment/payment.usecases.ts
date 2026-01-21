import { CreatePaymentInput } from '@/features/payment/payment.dto';
import { $Enums, PrismaClient } from '@/lib/generated/prisma';
import { createPaymentService } from '@/features/payment/services/payment.service';
import PaymentProvider = $Enums.PaymentProvider;
import { getItemsQtyByDraftId } from '@/features/order_draft/order_draft.service';
import { prisma } from '@/lib/db';
import { createOrder } from '@/app/actions/order';
import { getActiveIntent } from '@/features/payment/services/payment_intent.service';
import { StockManager } from '@/lib/stock-manager';

export const createCheckoutRequestUseCase = async (
  prisma: PrismaClient,
  input: {
    params: CreatePaymentInput;
    orderList: string[];
  }
) => {
  return prisma.$transaction(async (tx) => {
    const payment = await createPaymentService(tx, {
      provider: input.params.provider,
      method: input.params.method,
      amount: input.params.amount,
      status: input.params.status,
      currency: input.params.currency,
      externalId: input.params.externalId,
      idempotencyKey: input.params.idempotencyKey,
      rawPayload: input.params.rawPayload,
    });

    if (!payment) {
      throw new Error('Failed to create payment record');
    }

    await tx.orderPayment.createMany({
      data: input.orderList.map((order) => ({
        orderId: order,
        paymentId: payment.id,
      })),
    });

    return payment;
  });
};

interface CheckoutPreparationResult {
  orderIds: string[];
  orderList: any[]; // Bạn nên thay any bằng Type Order của Prisma
  draftItems: { variantId: string; quantity: number }[];
  inventoryReserved: boolean;
}

export async function prepareOrderForCheckout(
  draftId: string,
  provider: PaymentProvider
): Promise<CheckoutPreparationResult> {
  let draftItems: { variantId: string; quantity: number }[] = [];
  const reservedItems: { variantId: string; quantity: number }[] = [];
  // 1. Validate & Get Items
  const lockQty = await getItemsQtyByDraftId(draftId);
  if (!lockQty || !lockQty.items) {
    throw new Error('Invalid Draft Order');
  }

  draftItems = lockQty.items as { variantId: string; quantity: number }[];

  for (const item of draftItems) {
    const success = await StockManager.reserveStock(
      item.variantId,
      item.quantity
    );

    if (!success) {
      if (reservedItems.length > 0) {
        await Promise.all(
          reservedItems.map((i) =>
            StockManager.releaseStock(i.variantId, i.quantity)
          )
        );
      }
      throw new Error(`Sản phẩm ${item.variantId} đã hết hàng!`);
    }

    reservedItems.push(item);
  }

  let orderResult;

  try {
    // 2. Lock Stock (Transaction)
    orderResult = await prisma.$transaction(async (tx) => {
      for (const { variantId, quantity } of draftItems) {
        const result = await tx.productVariant.updateMany({
          where: {
            id: variantId,
            stock: { gte: quantity },
          },
          data: {
            stock: { decrement: quantity },
          },
        });
        if (result.count === 0)
          throw new Error(`DB: Sản phẩm ${variantId} không đủ tồn kho`);
      }
      return await createOrder(tx, draftId);
    });
  } catch (dbError) {
    console.error('DB Transaction Failed, Rolling back Redis...', dbError);
    await Promise.all(
      reservedItems.map((i) =>
        StockManager.releaseStock(i.variantId, i.quantity)
      )
    );
    throw dbError;
  }
  // 3. Create Order
  if (!orderResult.success) {
    await Promise.all(
      reservedItems.map((i) =>
        StockManager.releaseStock(i.variantId, i.quantity)
      )
    );
    throw new Error(orderResult.error || 'Create order failed');
  }

  const orderList = orderResult.order;
  const orderIds = orderList.map((o) => o.id);

  // 4. Check Active Intent
  const activeIntent = await getActiveIntent(prisma, {
    provider: provider,
    status: $Enums.IntentStatus.ACTIVE,
    orderIds: orderIds,
  });

  if (activeIntent) {
    throw new Error('Payment is already in progress');
  }

  // Trả về dữ liệu cần thiết cho các bước tiếp theo
  return {
    orderIds,
    orderList,
    draftItems,
    inventoryReserved: true,
  };
}
