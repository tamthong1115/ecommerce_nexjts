import { NextRequest } from 'next/server';
import { createOrder } from '@/app/actions/order';
import { ResponseFactory } from '@/lib/api-response';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 } from 'uuid';
import dayjs from 'dayjs';
import crypto from 'crypto';
import { createCheckoutRequestUseCase } from '@/features/payment/payment.usecases';
import { prisma } from '@/lib/db';
import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import PaymentStatus = $Enums.PaymentStatus;
import Currency = $Enums.Currency;
import {
  createPaymentIntentService,
  updatePaymentIntentService,
} from '@/features/payment/services/payment_intent.service';
import IntentStatus = $Enums.IntentStatus;

type CheckoutPayload = {
  id: string;
  url: string;
  amount_total: number | null;
  metadata?: Record<string, string>;
};
export async function POST(req: NextRequest) {
  let localIntent: { id: string } | null = null;
  try {
    const bodyJson = await req.json();
    const { draftId, body } = bodyJson;
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

    const result = await createOrder(draftId);
    if (!result.success) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({ message: result.error, code: 400 })
      );
    }

    const orderList = result.order;
    if (orderList.some((o) => o.paymentStatus === 'PAID')) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Đơn hàng đã được thanh toán',
          code: 400,
        })
      );
    }
    const orderIds = Array.from(orderList, (item) => item.id);
    const amountMOMO = orderList.reduce(
      (total, item) => total.plus(item.grandTotal),
      new Decimal(0)
    );

    //MOMO Infor
    const partnerCode = process.env.MOMO_PARTNER_CODE!;
    const accessKey = process.env.MOMO_ACCESS_KEY!;
    const secretKey = process.env.MOMO_SECRET_KEY!;
    const requestId = v4();
    const date = new Date();
    const orderId = `${draftId}_${date.getTime()}`;
    const orderInfo = `Thanh_toan_don_hang_qua_MOMO`;
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL!}success`;
    const ipnUrl = `${process.env.NEXT_PUBLIC_BASE_URL!}api/checkout/momo/ipn`;
    const requestType = 'captureWallet';
    const extraData = '';
    const amount = Number(amountMOMO);
    const lang = 'en';
    const autoCapture = true;

    const rawSignature =
      'accessKey=' +
      accessKey +
      '&amount=' +
      amount +
      '&extraData=' +
      extraData +
      '&ipnUrl=' +
      ipnUrl +
      '&orderId=' +
      orderId +
      '&orderInfo=' +
      orderInfo +
      '&partnerCode=' +
      partnerCode +
      '&redirectUrl=' +
      redirectUrl +
      '&requestId=' +
      requestId +
      '&requestType=' +
      requestType;

    const hashSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    //Create local payment intent
    const expiresAt = dayjs().add(15, 'minute').toDate();
    localIntent = await createPaymentIntentService(prisma, {
      gatewayRef: null,
      provider: PaymentProvider.MOMO,
      orderIds: { orderIds: orderIds },
      status: IntentStatus.ACTIVE,
      amount: new Decimal(amount),
      currency: Currency.VND,
      expiresAt: expiresAt,
    });

    //Init body for req of MOMO api
    const requestBody = JSON.stringify({
      partnerCode: partnerCode,
      partnerName: 'Test',
      storeId: 'MomoTestStore',
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      signature: hashSignature,
    });

    const momoRes = await fetch(process.env.MOMO_API_END_POINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    const momoData = await momoRes.json();
    if (momoData.resultCode !== 0) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: momoData.message || 'MoMo create payment failed',
          code: 400,
        })
      );
    }

    //Update gatewayRef to local intent
    await updatePaymentIntentService(localIntent.id, {
      gatewayRef: momoData.requestId,
    });

    await createCheckoutRequestUseCase(prisma, {
      params: {
        provider: PaymentProvider.MOMO,
        method: 'QR',
        amount: amount,
        status: PaymentStatus.PENDING,
        idempotencyKey: idenKey,
        currency: Currency.VND,
        externalId: orderId,
        rawPayload: {
          id: requestId,
          url: momoData.payUrl,
          amount_total: amount,
          metadata: {
            provider: 'MOMO',
            orderId,
            orderInfo,
            requestType,
            orderIds,
            draftId,
          },
        },
      },
      orderList: orderIds,
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: { url: momoData.payUrl },
        code: 200,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: error + 'Internal Server Error',
        code: 500,
      })
    );
  }
}
