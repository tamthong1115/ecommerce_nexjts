import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';
import dayjs from 'dayjs';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { prepareOrderForCheckout } from '@/features/payment/payment.usecases';
import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import Currency = $Enums.Currency;
import { createPaymentIntentService } from '@/features/payment/services/payment_intent.service';
import IntentStatus = $Enums.IntentStatus;
import { paymentHookQueue, paymentQueue } from '@/worker/config';
import { Decimal } from '@prisma/client-runtime-utils';

export function sortObject(
  obj: Record<string, string | number>
): Record<string, string> {
  const sorted: Record<string, string> = {};

  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = encodeURIComponent(String(obj[key]));
    });

  return sorted;
}

type CheckoutPayload = {
  id: string;
  url: string;
  vnp_BankCode: string | null;
  amount_total: number | null;
  metadata?: Record<string, string>;
};

export async function POST(req: NextRequest) {
  let localIntent: { id: string } | null = null;
  let draftItems: { variantId: string; quantity: number }[] = [];
  let inventoryReserved = false;

  try {
    const { draftId, body } = await req.json();
    const ipAddr =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    const origin = process.env.NEXT_PUBLIC_BASE_URL!;
    const idenKey = body.idempotencyKey;

    const existed = await prisma.payment.findUnique({
      where: { idempotencyKey: idenKey },
    });

    if (existed && existed.rawPayload) {
      const payload = existed.rawPayload as CheckoutPayload;
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
      PaymentProvider.VNPAY
    );
    draftItems = preparedData.draftItems;
    inventoryReserved = preparedData.inventoryReserved;
    const { orderList, orderIds } = preparedData;

    const amountVNPay = orderList.reduce(
      (total, order) => total.plus(order.grandTotal),
      new Decimal(0)
    );

    localIntent = await createPaymentIntentService(prisma, {
      gatewayRef: null,
      provider: PaymentProvider.VNPAY,
      orderIds: { orderIds: orderIds },
      status: IntentStatus.ACTIVE,
      amount: amountVNPay,
      currency: Currency.VND,
      expiresAt: dayjs().add(15, 'minute').toDate(),
    });

    await paymentQueue().add(
      'create-payment-url',
      {
        provider: PaymentProvider.VNPAY,
        intentId: localIntent.id,
        orderIds: orderIds,
        amount: amountVNPay.toNumber(),
        currency: Currency.VND,
        idempotencyKey: idenKey,
        origin: origin,
        draftItems: draftItems,
        method: 'CARD',

        ipAddr: ipAddr,
        draftId: draftId,
        bankCode: body.bankCode,
        language: body.language,
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
    console.error('Error creating VNPAY session:', err);
    if (inventoryReserved && draftItems.length > 0) {
      console.log('riggering Inventory Rollback...');
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
        code: isBadReq ? 400 : 500,
      })
    );
  }
}
//Get webhook
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // 1. Chuyển searchParams thành Object để xử lý
    const vnp_Params: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      vnp_Params[key] = value;
    }

    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // 2. Sắp xếp key
    const sortedKeys = Object.keys(vnp_Params).sort();

    // 3. Tạo chuỗi ký tên
    const signData = sortedKeys
      .map((key) => {
        return `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+')}`;
      })
      .join('&');

    const secretKey = process.env.VNPAY_SECRET_KEY!;
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // 4. Verify Signature
    if (secureHash !== signed) {
      console.error('[VNPAY IPN] Invalid Checksum');
      return NextResponse.json({ RspCode: '97', Message: 'Fail checksum' });
    }

    // 5. Đẩy vào Queue
    await paymentHookQueue().add(
      'process-webhook',
      {
        provider: $Enums.PaymentProvider.VNPAY,
        payload: vnp_Params,
      },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      }
    );

    return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error) {
    console.error('[VNPAY IPN] Error:', error);
    return NextResponse.json({ RspCode: '99', Message: 'Unknown Error' });
  }
}
