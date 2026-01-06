import { NextRequest, NextResponse } from 'next/server';
import { getOrdersCanPay } from '@/features/order/order.service';
import { ResponseFactory } from '@/lib/api-response';
import { stripe } from '@/lib/payment';
import { vndToUsdCents } from '@/lib/currency-helper';
import { Decimal } from '@/lib/generated/prisma/runtime/library';
import getRedisClient from '@/lib/redis';
import dayjs from 'dayjs';
import { createPaymentIntentService } from '@/features/payment/services/payment_intent.service';
import { prisma } from '@/lib/db';
import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import IntentStatus = $Enums.IntentStatus;
import Currency = $Enums.Currency;

export async function POST(req: NextRequest) {
  const localIntent: { id: string } | null = null;
  try {
    const { orderIds } = await req.json();
    const origin = process.env.NEXT_PUBLIC_BASE_URL!;

    const order = await getOrdersCanPay(orderIds);

    if (order.length === 0) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({ message: 'Order Not Found', code: 400 })
      );
    }

    const client = await getRedisClient();
    const rate = await client.get('currency-rate');
    if (!rate)
      return NextResponse.json({ error: 'redis error' }, { status: 400 });

    const rateDcm = new Decimal(rate);
    const metadata: Record<string, string> = {
      orderId: order.map((o) => o.id).join(','),
    };
    let totalUsdCent = 0;
    for (const orderItem of order) {
      const priceUsd = vndToUsdCents(
        new Decimal(Number(orderItem.grandTotal)),
        rateDcm
      );
      const usdCents = priceUsd.toNumber();
      totalUsdCent += usdCents;
      metadata[`_${orderItem.id}`] = usdCents.toString();
    }

    const totalGrand = order.reduce(
      (total, order) => total.plus(order.grandTotal),
      new Decimal(0)
    );

    const session = await stripe.checkout.sessions.create({
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
              name: `Thanh toán ${order.length} đơn hàng`,
            },
            unit_amount: totalUsdCent,
          },
          quantity: 1,
        },
      ],
    });

    const expiresAt = dayjs().add(30, 'minute').toDate();
    await createPaymentIntentService(prisma, {
      gatewayRef: session.payment_intent as string,
      provider: PaymentProvider.STRIPE,
      orderIds: { orderIds: orderIds },
      status: IntentStatus.ACTIVE,
      amount: totalGrand,
      currency: Currency.USD,
      expiresAt: expiresAt,
    });
  } catch (error) {}
}
