import { NextRequest, NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { createOrder } from '@/app/actions/order';
import { prisma } from '@/lib/db';
import { Decimal } from '@/lib/generated/prisma/runtime/library';
import getRedisClient from '@/lib/redis';
import { vndToUsdCents } from '@/lib/currency-helper';
import { createCheckoutRequestUseCase } from '@/features/payment/payment.usecases';
import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import PaymentStatus = $Enums.PaymentStatus;
import Currency = $Enums.Currency;
import {
  createPaymentIntentService,
  getActiveIntent,
  updatePaymentIntentService,
} from '@/features/payment/services/payment_intent.service';
import IntentStatus = $Enums.IntentStatus;
import dayjs from 'dayjs';
import { ResponseFactory } from '@/lib/api-response';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type CheckoutPayload = {
  id: string;
  url: string;
  payment_status: string | null;
  amount_total: number | null;
  metadata?: Record<string, string>;
};

export async function POST(req: NextRequest) {
  let localIntent: { id: string } | null = null;
  try {
    //lấy đơn hàng nháp
    const { draftId, body } = await req.json();
    const origin = process.env.NEXT_PUBLIC_BASE_URL!;
    const idenKey = body.idempotencyKey;

    //Check idenKey tránh double click
    const existed = await prisma.payment.findUnique({
      where: { idempotencyKey: idenKey },
    });

    if (existed) {
      const payload = existed.rawPayload as CheckoutPayload | null;
      if (payload?.url) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.success({
            data: { url: payload.url, reused: true },
          })
        );
      }
    }

    //tạo đơn
    const result = await createOrder(draftId);
    if (!result.success) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: result.error,
          code: 400,
        })
      );
    }

    const orderList = result.order;
    const orderIds = Array.from(orderList.map((o) => o.id));

    //Kiểm tra xem có giao dịch nào đang thực hiện ko
    const activeIntent = await getActiveIntent(prisma, {
      provider: PaymentProvider.STRIPE,
      status: IntentStatus.ACTIVE,
      orderIds: orderIds,
    });

    if (activeIntent) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({ message: 'Payment is already in progress' })
      );
    }

    //gọi redis lấy tỉ giá && tính các thông tin
    const client = await getRedisClient();
    const rate = await client.get('currency-rate');
    if (!rate)
      return NextResponse.json({ error: 'redis error' }, { status: 400 });

    const rateDcm = new Decimal(rate);

    const metadata: Record<string, string> = {
      orderId: orderList.map((o) => o.id).join(','),
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

    //Tạo session stripe payment
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${origin}/success`,
        cancel_url: `${origin}/cancel`,
        metadata: metadata,
        payment_intent_data: {
          transfer_group: metadata.orderId,
          metadata: metadata,
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Thanh toán ${orderList.length} đơn hàng`,
              },
              unit_amount: totalUsdCent,
            },
            quantity: 1,
          },
        ],
      },
      { idempotencyKey: idenKey }
    );

    await updatePaymentIntentService(localIntent.id, {
      gatewayRef: session.payment_intent as string,
    });

    //Tạo data payment && order
    try {
      await createCheckoutRequestUseCase(prisma, {
        params: {
          provider: PaymentProvider.STRIPE,
          method: 'CARD',
          amount: totalUsdCent,
          status: PaymentStatus.PENDING,
          currency: Currency.USD,
          externalId: session.payment_intent as string,
          idempotencyKey: idenKey, // Unique field
          rawPayload: {
            id: session.id,
            url: session.url,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
            metadata: session.metadata,
          },
        },
        orderList: orderIds,
      });
    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        console.log('Race condition detected, returning existing payment');
        return ResponseFactory.toNextResponse(
          ResponseFactory.success({ data: { url: session.url } })
        );
      }
      console.error('💥 DB Error in checkout:', dbError);
      throw dbError;
    }

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: { url: session.url } })
    );
  } catch (err) {
    console.error('Error creating Stripe session:', err);
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: err instanceof Error ? err.message : 'Internal Server Error',
        code: 500,
      })
    );
  }
}
