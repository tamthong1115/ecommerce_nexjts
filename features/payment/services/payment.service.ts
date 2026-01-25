import { CreatePaymentInput } from '@/features/payment/payment.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/db';
import { DbClient } from '@/types/api';

export const createPaymentService = async (
  db: DbClient,
  params: CreatePaymentInput
) => {
  return prisma.payment.create({
    data: {
      provider: params.provider,
      method: params.method,
      amount: new Decimal(params.amount),
      status: params.status,
      currency: params.currency,
      externalId: params.externalId,
      idempotencyKey: params.idempotencyKey,
      rawPayload: params.rawPayload,
    },
  });
};

export const getPaymentSession = async (db: DbClient, id: string) => {
  return db.payment.findUnique({
    where: { idempotencyKey: id },
    include: {
      orders: true,
    },
  });
};
