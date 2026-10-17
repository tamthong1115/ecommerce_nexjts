import { DbClient } from '@/types/api';
import { ServiceError } from '@/lib/service-error';

export async function reservePromotion(
  db: DbClient,
  params: {
    promotionId: string;
    userId: string;
    orderDraftId?: string;
    orderId?: string;
  }
) {
  const promo = await db.promotion.findUnique({
    where: { id: params.promotionId },
    select: { id: true, usageLimit: true, perUserLimit: true, code: true },
  });

  if (!promo) {
    throw new ServiceError('Khuyến mãi không tồn tại', 404);
  }

  if (promo.perUserLimit) {
    const userUsedCount = await db.promotionRedemption.count({
      where: {
        promotionId: params.promotionId,
        userId: params.userId,
        status: { in: ['RESERVED', 'COMMITTED'] },
      },
    });

    if (userUsedCount >= promo.perUserLimit) {
      throw new ServiceError(`Bạn đã dùng hết số lượt của mã ${promo.code || ''}`, 400);
    }
  }

  if (promo.usageLimit !== null) {
    const affected = await db.$executeRaw`
      UPDATE "promotion"
      SET "usedCount" = "usedCount" + 1
      WHERE "id" = ${params.promotionId}::uuid
        AND "status" = 'ACTIVE'
        AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
    `;

    if (Number(affected) === 0) {
      throw new ServiceError(`Mã ${promo.code || ''} đã hết lượt sử dụng`, 400);
    }
  } else {
    await db.promotion.update({
      where: { id: params.promotionId },
      data: { usedCount: { increment: 1 } },
    });
  }

  return db.promotionRedemption.create({
    data: {
      promotionId: params.promotionId,
      userId: params.userId,
      orderDraftId: params.orderDraftId,
      orderId: params.orderId,
      status: 'RESERVED',
      reservedAt: new Date(),
    },
  });
}

export async function commitRedemptions(
  db: DbClient,
  params: {
    orderId: string;
  }
) {
  return db.promotionRedemption.updateMany({
    where: {
      orderId: params.orderId,
      status: 'RESERVED',
    },
    data: {
      status: 'COMMITTED',
      committedAt: new Date(),
    },
  });
}

export async function releaseRedemptions(
  db: DbClient,
  params: {
    orderDraftId?: string;
    orderId?: string;
  }
) {
  const redemptions = await db.promotionRedemption.findMany({
    where: {
      OR: [
        params.orderDraftId ? { orderDraftId: params.orderDraftId } : {},
        params.orderId ? { orderId: params.orderId } : {},
      ],
      status: { in: ['RESERVED', 'COMMITTED'] },
    },
  });

  if (redemptions.length === 0) return;

  for (const r of redemptions) {
    await db.$executeRaw`
      UPDATE "promotion"
      SET "usedCount" = GREATEST("usedCount" - 1, 0)
      WHERE "id" = ${r.promotionId}::uuid
    `;
  }

  await db.promotionRedemption.updateMany({
    where: {
      id: { in: redemptions.map((r) => r.id) },
    },
    data: {
      status: 'RELEASED',
      releasedAt: new Date(),
    },
  });
}
