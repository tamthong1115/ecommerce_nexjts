import { Decimal } from '@prisma/client/runtime/library';
import { DbClient } from '@/types/api';

export const upsertPendingBalance = async (
  db: DbClient,
  shopId: string,
  amount: Decimal
) => {
  const rows = await db.$queryRaw<{ pending: Decimal }[]>`
    SELECT pending
    FROM "ShopBalance"
    WHERE "shopId" = ${shopId}::uuid
      FOR UPDATE
  `;

  if (rows.length > 0) {
    return db.shopBalance.update({
      where: { shopId },
      data: {
        pending: { increment: amount },
        version: { increment: 1 },
      },
    });
  } else {
    return db.shopBalance.create({
      data: {
        shopId,
        pending: amount,
        available: 0,
        frozen: 0,
        version: 1,
      },
    });
  }
};

export const updateShopBalance = async (
  db: DbClient,
  shopId: string,
  amount: Decimal
) => {
  return db.shopBalance.update({
    where: { shopId: shopId },
    data: {
      pending: { decrement: amount },
      available: { increment: amount },
      version: { increment: 1 },
    },
  });
};

export const freezeShopBalanceForPayout = async (
  db: DbClient,
  params: {
    shopId: string;
    version: number;
    amount: Decimal;
  }
) => {
  return db.shopBalance.update({
    where: { shopId: params.shopId, version: params.version },
    data: {
      available: { decrement: params.amount },
      frozen: { increment: params.amount },
      version: { increment: 1 },
    },
  });
};
