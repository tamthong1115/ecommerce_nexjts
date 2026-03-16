import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';
import dayjs from 'dayjs';
import { prepareOrderForCheckout } from '@/features/payment/payment.usecases';
import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import Currency = $Enums.Currency;
import { createPaymentIntentService } from '@/features/payment/services/payment_intent.service';
import IntentStatus = $Enums.IntentStatus;
import { paymentQueue } from '@/worker/config';
import { Decimal } from '@prisma/client-runtime-utils';
import { prisma_clean } from '@/lib/queue/prisma-clean';

type CheckoutPayload = {
  id: string;
  url: string;
  amount_total: number | null;
  metadata?: Record<string, string>;
};
export async function POST(req: NextRequest) {
  let localIntent: { id: string } | null = null;
  let draftItems: { variantId: string; quantity: number }[] = [];
  let inventoryReserved = false;
  try {
    const { draftId, body } = await req.json();
    const origin = process.env.NEXT_PUBLIC_BASE_URL!;
    const idenKey = body.idempotencyKey;

    //Check idenKey tránh double click
    const existed = await prisma_clean.payment.findUnique({
      where: { idempotencyKey: idenKey },
    });
    if (existed && existed.rawPayload) {
      const payload = existed.rawPayload as CheckoutPayload | null;
      if (payload?.url) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.success({
            data: { url: payload.url, reused: true },
          })
        );
      }
    }

    const preparedData = await prepareOrderForCheckout(
      draftId,
      PaymentProvider.MOMO
    );

    draftItems = preparedData.draftItems;
    inventoryReserved = preparedData.inventoryReserved;
    const { orderList, orderIds } = preparedData;

    const amountMOMO = orderList.reduce(
      (total, item) => total.plus(item.grandTotal),
      new Decimal(0)
    );

    const metadata = { orderId: orderIds.join(',') };

    //Create local payment intent
    const expiresAt = dayjs().add(15, 'minute').toDate();
    localIntent = await createPaymentIntentService(prisma_clean, {
      gatewayRef: null,
      provider: PaymentProvider.MOMO,
      orderIds: { orderIds: orderIds },
      status: IntentStatus.ACTIVE,
      amount: amountMOMO,
      currency: Currency.VND,
      expiresAt: expiresAt,
    });

    await paymentQueue().add(
      'create-payment-url',
      {
        provider: PaymentProvider.MOMO,
        intentId: localIntent.id,
        orderIds: orderIds,
        amount: amountMOMO.toNumber(),
        currency: Currency.VND,
        idempotencyKey: idenKey,
        origin: origin,
        draftItems: draftItems,
        metadata: metadata,
        method: 'QR',
        draftId: draftId,
      },
      {
        jobId: `checkout-${idenKey}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      }
    );

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        message: 'Order created. Redirecting to MoMo...',
        data: {
          isProcessing: true,
          intentId: localIntent.id,
        },
      })
    );
  } catch (error) {
    console.error('Error creating MOMO session:', error);

    // Logic Rollback kho nếu lỗi xảy ra trước khi vào Queue
    if (inventoryReserved && draftItems.length > 0) {
      console.log('Triggering Inventory Rollback...');
      await prisma_clean
        .$transaction(
          draftItems.map(({ variantId, quantity }) =>
            prisma_clean.productVariant.update({
              where: { id: variantId },
              data: { stock: { increment: quantity } },
            })
          )
        )
        .catch((e) => console.error('Rollback failed!', e));
    }

    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    const isBadReq =
      message.includes('không đủ tồn kho') ||
      message.includes('failed') ||
      message.includes('Invalid Draft') ||
      message.includes('already in progress');

    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: message,
        code: isBadReq ? 400 : 500,
      })
    );
  }
}
