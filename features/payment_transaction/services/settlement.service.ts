import { Prisma } from '@/lib/generated/prisma';
import { Decimal } from '@/lib/generated/prisma/runtime/client';
import { prisma } from '@/lib/db';

export const enqueueSettlement = async (
  tx: Prisma.TransactionClient,
  params: {
    shopId: string;
    orderId: string;
    amount: Decimal;
    dueAt: Date;
  }
) => {
  return tx.settlementQueue.create({
    data: {
      shopId: params.shopId,
      orderId: params.orderId,
      amount: params.amount,
      status: 'PENDING',
      dueAt: params.dueAt,
    },
  });
};

export const getPendingSettlement = async (now: Date) => {
  return prisma.settlementQueue.findMany({
    where: {
      status: 'PENDING',
      dueAt: { lte: now },
    },
    take: 100, // Process từng batch nhỏ
  });
};

export const getUniqueSettlement = async (
  tx: Prisma.TransactionClient,
  id: string
) => {
  return tx.settlementQueue.findUnique({
    where: { id: id },
  });
};
