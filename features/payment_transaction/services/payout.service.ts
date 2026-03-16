import { $Enums, Prisma } from '@/lib/generated/prisma';
import PayoutStatus = $Enums.PayoutStatus;
import { DbClient } from '@/types/api';
import Decimal = Prisma.Decimal;
import InputJsonValue = Prisma.InputJsonValue;
import { prisma_clean } from '@/lib/queue/prisma-clean';

export const createPayoutRequest = async (
  db: DbClient,
  params: {
    shopId: string;
    amount: Decimal;
    bankInfo: InputJsonValue;
    txRef?: string;
  }
) => {
  return db.payoutRequest.create({
    data: {
      shopId: params.shopId,
      amount: params.amount,
      status: PayoutStatus.REQUESTED,
      bankInfo: params.bankInfo,
      txRef: params.txRef,
      createdAt: new Date(),
    },
  });
};

export const getPayoutRequest = async (shopId: string) => {
  return prisma_clean.payoutRequest.findFirst({
    where: {
      shopId: shopId,
      status: PayoutStatus.REQUESTED,
    },
    orderBy: { createdAt: 'desc' },
  });
};
