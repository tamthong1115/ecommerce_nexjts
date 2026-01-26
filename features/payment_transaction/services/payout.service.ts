import { $Enums } from '@/lib/generated/prisma';
import { Decimal, InputJsonValue } from '@/lib/generated/prisma/runtime/client';
import PayoutStatus = $Enums.PayoutStatus;
import { DbClient } from '@/types/api';
import { prisma } from '@/lib/db';

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
  return prisma.payoutRequest.findFirst({
    where: {
      shopId: shopId,
      status: PayoutStatus.REQUESTED,
    },
    orderBy: { createdAt: 'desc' },
  });
};
