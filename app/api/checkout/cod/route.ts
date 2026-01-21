import { NextRequest } from 'next/server';
import { createOrder } from '@/app/actions/order';
import { ResponseFactory } from '@/lib/api-response';
import { createCheckoutRequestUseCase } from '@/features/payment/payment.usecases';
import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';
import PaymentStatus = $Enums.PaymentStatus;
import Currency = $Enums.Currency;

export async function POST(req: NextRequest) {
  try {
    const { draftId } = await req.json();

    const result = await createOrder(prisma, draftId);
    if (!result.success) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: result.error,
          code: 400,
        })
      );
    }
    const orderList = result.order;
    const amount = orderList.reduce(
      (total, item) => total.plus(item.grandTotal),
      new Decimal(0)
    );
    const date = new Date();
    await createCheckoutRequestUseCase(prisma, {
      params: {
        provider: PaymentProvider.CASH,
        method: 'CASH ON DELIVERY',
        amount: Number(amount),
        status: PaymentStatus.PENDING,
        currency: Currency.VND,
        externalId: `COD_${date.getTime()}`,
        rawPayload: {
          type: 'COD',
          note: 'Pay when receive goods',
          createdAt: new Date().toISOString(),
        },
      },
      orderList: orderList.map((item) => item.id),
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL!}/success`,
        },
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message:
          error instanceof Error ? error.message : 'Internal Server Error',
        code: 500,
      })
    );
  }
}
