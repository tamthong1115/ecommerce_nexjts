import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { $Enums } from '@/lib/generated/prisma';
import { paymentHookQueue } from '@/worker/config';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      amount,
      partnerCode,
      orderId,
      extraData,
      signature,
      transId,
      responseTime,
      resultCode,
      message,
      payType,
      requestId,
      orderInfo,
    } = body;

    const secretKey = process.env.MOMO_SECRET_KEY!;
    const accessKey = process.env.MOMO_ACCESS_KEY!;

    const rawSignature =
      'accessKey=' +
      accessKey +
      '&amount=' +
      amount +
      '&extraData=' +
      extraData +
      '&message=' +
      message +
      '&orderId=' +
      orderId +
      '&orderInfo=' +
      orderInfo +
      '&partnerCode=' +
      partnerCode +
      '&payType=' +
      payType +
      '&requestId=' +
      requestId +
      '&responseTime=' +
      responseTime +
      '&resultCode=' +
      resultCode +
      '&transId=' +
      transId;

    const signKey = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    if (signKey !== signature) {
      console.error('[MOMO IPN] Invalid Signature', { orderId });
      return new NextResponse(null, { status: 400 });
    }

    await paymentHookQueue().add(
      'process-webhook',
      {
        provider: $Enums.PaymentProvider.MOMO,
        payload: body,
      },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      }
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal Error' + error },
      { status: 500 }
    );
  }
}
