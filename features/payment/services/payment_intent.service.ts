import InputJsonValue = Prisma.InputJsonValue;
import { $Enums, Prisma } from '@/lib/generated/prisma';
import { DbClient } from '@/types/api';
import PaymentProvider = $Enums.PaymentProvider;
import { prisma_clean } from '@/lib/queue/prisma-clean';
import IntentStatus = $Enums.IntentStatus;
import Currency = $Enums.Currency;

export const createPaymentIntentService = async (
  db: DbClient,
  params: {
    gatewayRef: string | null;
    provider: PaymentProvider;
    status: IntentStatus;
    orderIds: InputJsonValue;
    amount: Prisma.Decimal;
    currency: Currency;
    expiresAt: Date;
  }
) => {
  return db.paymentIntent.create({
    data: {
      gatewayRef: params.gatewayRef,
      provider: params.provider,
      status: params.status,
      orderIds: params.orderIds,
      amount: params.amount,
      currency: params.currency,
      expiresAt: params.expiresAt,
    },
  });
};

export const updatePaymentIntentService = async (
  id: string,
  params: {
    gatewayRef?: string;
    provider?: PaymentProvider;
    status?: IntentStatus;
    orderIds?: InputJsonValue;
    amount?: Prisma.Decimal;
    currency?: Currency;
    expiresAt?: Date;
  }
) => {
  const { currency, ...rest } = params;
  return prisma.paymentIntent.update({
    where: { id: id },
    data: rest,
  });
};

export const getPaymentIntentByGatewayRefService = async (
  gatewayRef: string
) => {
  return prisma_clean.paymentIntent.findUnique({
    where: { gatewayRef },
  });
};

export const getActiveIntent = async (
  db: DbClient,
  params: {
    provider: PaymentProvider;
    status: IntentStatus;
    orderIds: string[];
  }
) => {
  return db.paymentIntent.findFirst({
    where: {
      provider: params.provider,
      status: params.status,
      expiresAt: { gt: new Date() },
      orderIds: { array_contains: params.orderIds },
    },
    orderBy: { createdAt: 'desc' },
  });
};
