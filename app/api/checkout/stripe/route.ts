import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { vndToUsdCents } from '@/lib/currency-helper';
import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import Currency = $Enums.Currency;
import { createPaymentIntentService } from '@/features/payment/services/payment_intent.service';
import IntentStatus = $Enums.IntentStatus;
import dayjs from 'dayjs';
import { ResponseFactory } from '@/lib/api-response';
import redisClient from '@/lib/redis';
import { paymentQueue } from '@/worker/config';
import { prepareOrderForCheckout } from '@/features/payment/payment.usecases';
import { Decimal } from '@prisma/client-runtime-utils';

type CheckoutPayload = {
  id: string;
  url: string;
  payment_status: string | null;
  amount_total: number | null;
  metadata?: Record<string, string>;
};

export async function POST(req: NextRequest) {
  let localIntent: { id: string } | null = null;
  let inventoryReserved = false;
  let draftItems: { variantId: string; quantity: number }[] = [];

  try {
    //lấy đơn hàng nháp
    const { draftId, body } = await req.json();
    const origin = process.env.NEXT_PUBLIC_BASE_URL!;
    const idenKey = body.idempotencyKey;

    //Check idenKey avoid double click
    const existed = await prisma.payment.findUnique({
      where: { idempotencyKey: idenKey },
    });

    if (existed && existed.rawPayload) {
      const payload = existed.rawPayload as CheckoutPayload;
      if (payload.url) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.success({
            data: { url: payload.url, reused: true },
          })
        );
      }
    }

    const preparedData = await prepareOrderForCheckout(
      draftId,
      PaymentProvider.STRIPE
    );
    draftItems = preparedData.draftItems;
    inventoryReserved = preparedData.inventoryReserved;
    const { orderList, orderIds } = preparedData;

    //gọi redis lấy tỉ giá && tính các thông tin
    const rate = await redisClient.get('currency-rate');
    if (!rate) throw new Error('Redis currency rate missing');
    const rateDcm = new Decimal(rate);

    const metadata: Record<string, string> = {
      orderId: orderIds.join(','),
    };

    let totalUsdCent = 0;

    for (const order of orderList) {
      const priceUsd = vndToUsdCents(
        new Decimal(order.grandTotal),
        rateDcm
      ).toNumber();
      totalUsdCent += priceUsd;
      metadata[`_${order.id}`] = priceUsd.toString();
    }

    //Tạo local payment intent
    const expiresAt = dayjs().add(30, 'minute').toDate();

    localIntent = await createPaymentIntentService(prisma, {
      gatewayRef: null,
      provider: PaymentProvider.STRIPE,
      orderIds: { orderIds: orderIds },
      status: IntentStatus.ACTIVE,
      amount: new Decimal(totalUsdCent),
      currency: Currency.USD,
      expiresAt: expiresAt,
    });

    //Đẩy vao queue xử lý (worker sẽ tạo session stripe)
    await paymentQueue().add(
      'create-payment-url',
      {
        provider: PaymentProvider.STRIPE,
        intentId: localIntent.id,
        orderIds: orderIds,
        amount: totalUsdCent,
        currency: Currency.USD,
        metadata: metadata,
        idempotencyKey: idenKey,
        draftItems: draftItems,
        method: 'CARD',
        origin: origin,
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
        message: 'Order created. Payment processing...',
        data: {
          isProcessing: true,
          intentId: localIntent.id,
        },
      })
    );
  } catch (err) {
    console.error('Error creating Stripe session:', err);
    if (inventoryReserved && draftItems.length > 0) {
      console.log('🔄 Triggering Inventory Rollback...');
      await prisma
        .$transaction(
          draftItems.map(({ variantId, quantity }) =>
            prisma.productVariant.update({
              where: { id: variantId },
              data: { stock: { increment: quantity } },
            })
          )
        )
        .catch((e) => console.error('🔥 Rollback failed!', e));
    }
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';
    const isBadReq =
      message.includes('không đủ tồn kho') ||
      message.includes('failed') ||
      message.includes('Invalid Draft') ||
      message.includes('already in progress');

    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: message,
        code: isBadReq ? 400 : 500, // Tự động phân loại 400/500 dựa vào message
      })
    );
  }
}
