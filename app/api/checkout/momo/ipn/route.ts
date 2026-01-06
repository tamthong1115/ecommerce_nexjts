import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { customerPaidOrderSuccessUsecase } from '@/features/payment_transaction/payment_transaction.usecases';
import { $Enums } from '@/lib/generated/prisma';
import PaymentStatus = $Enums.PaymentStatus;

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

    const payment = await prisma.payment.findFirst({
      where: {
        externalId: orderId,
        provider: 'MOMO',
      },
      include: {
        orders: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!payment) {
      return new NextResponse(null, { status: 400 });
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
      });
    }

    const orderDetails = payment.orders.map((op) => op.order);
    const orderIds = orderDetails.map((o) => o.id);

    if (resultCode === 0 || resultCode === 9000) {
      await prisma.$transaction(async (tx) => {
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

        if (updateResult.count === 0) {
          console.log(
            `Duplicate webhook detected for Payment ${payment.id}. Ignoring.`
          );
          return;
        }

        await tx.paymentIntent.update({
          where: { gatewayRef: orderId },
          data: {
            status: 'SUCCEEDED',
          },
        });

        // B. Update Order Status
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
            order.shopId!,
            order.grandTotal,
            order.id,
            payment.id,
            transId
          );
        }
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.paymentIntent.update({
          where: { gatewayRef: orderId },
          data: {
            status: 'FAILED',
          },
        });
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED', updatedAt: new Date() },
        });
        await tx.order.updateMany({
          where: { id: { in: orderIds } },
          data: { paymentStatus: 'FAILED', updatedAt: new Date() },
        });
      });
    }
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
