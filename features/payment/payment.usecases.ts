import { CreatePaymentInput } from '@/features/payment/payment.dto';
import { PrismaClient } from '@/lib/generated/prisma';
import { createPaymentService } from '@/features/payment/services/payment.service';

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
