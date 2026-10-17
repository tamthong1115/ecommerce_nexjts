import { DbClient } from '@/types/api';
import { PromotionRule } from '../engine/types';
import { Prisma } from '@/lib/generated/prisma';

export async function getAvailablePromotionsForCart(
  db: DbClient,
  params: {
    shopIds: string[];
    appliedCodes: string[];
    now?: Date;
  }
): Promise<PromotionRule[]> {
  const now = params.now || new Date();
  const normalizedCodes = params.appliedCodes.map((c) => c.trim().toUpperCase());

  const orConditions: Prisma.PromotionWhereInput[] = [
    { requiresCode: false },
  ];

  if (normalizedCodes.length > 0) {
    orConditions.push({
      code: { in: normalizedCodes, mode: 'insensitive' },
    });
  }

  const promotions = await db.promotion.findMany({
    where: {
      status: 'ACTIVE',
      startAt: { lte: now },
      endAt: { gte: now },
      OR: orConditions,
      AND: [
        {
          OR: [
            { ownerType: 'PLATFORM' },
            { shopId: { in: params.shopIds } },
          ],
        },
      ],
    },
    include: {
      scopes: true,
      tiers: true,
      gifts: true,
    },
    orderBy: { priority: 'asc' },
  });

  return promotions.map((p) => {
    const includedProductIds: string[] = [];
    const excludedProductIds: string[] = [];
    const includedCategoryIds: string[] = [];
    const excludedCategoryIds: string[] = [];
    const includedVariantIds: string[] = [];
    const excludedVariantIds: string[] = [];
    const includedShopIds: string[] = [];
    const excludedShopIds: string[] = [];

    for (const scope of p.scopes) {
      if (scope.scopeType === 'PRODUCT') {
        if (scope.isExcluded) excludedProductIds.push(scope.targetId);
        else includedProductIds.push(scope.targetId);
      } else if (scope.scopeType === 'CATEGORY') {
        if (scope.isExcluded) excludedCategoryIds.push(scope.targetId);
        else includedCategoryIds.push(scope.targetId);
      } else if (scope.scopeType === 'VARIANT') {
        if (scope.isExcluded) excludedVariantIds.push(scope.targetId);
        else includedVariantIds.push(scope.targetId);
      } else if (scope.scopeType === 'SHOP') {
        if (scope.isExcluded) excludedShopIds.push(scope.targetId);
        else includedShopIds.push(scope.targetId);
      }
    }

    return {
      id: p.id,
      code: p.code || undefined,
      name: p.name,
      kind: p.kind as PromotionRule['kind'],
      target: p.target as PromotionRule['target'],
      ownerType: p.ownerType as PromotionRule['ownerType'],
      shopId: p.shopId,
      sponsor: p.sponsor as PromotionRule['sponsor'],
      platformSharePct: p.platformSharePct,
      requiresCode: p.requiresCode,
      startAt: p.startAt,
      endAt: p.endAt,
      minSubtotal: p.minSubtotal ? Number(p.minSubtotal) : undefined,
      minQuantity: p.minQuantity || undefined,
      currency: p.currency as 'VND' | 'USD',
      percentage: p.percentage ? Number(p.percentage) : undefined,
      fixedAmount: p.fixedAmount ? Number(p.fixedAmount) : undefined,
      maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : undefined,
      overridePrice: p.overridePrice ? Number(p.overridePrice) : undefined,
      stockLimit: p.stockLimit || undefined,
      usageLimit: p.usageLimit || undefined,
      perUserLimit: p.perUserLimit || undefined,
      stackMode: p.stackMode as PromotionRule['stackMode'],
      stackGroupId: p.stackGroupId || undefined,
      priority: p.priority,
      reducesTaxBase: p.reducesTaxBase,
      scope: {
        includedProductIds,
        excludedProductIds,
        includedCategoryIds,
        excludedCategoryIds,
        includedVariantIds,
        excludedVariantIds,
        includedShopIds,
        excludedShopIds,
      },
      tiers: p.tiers.map((t) => ({
        from: Number(t.from),
        to: t.to ? Number(t.to) : undefined,
        benefitType: t.benefitType as 'PERCENT' | 'FIXED' | 'GIFT',
        value: Number(t.value),
        maxDiscount: t.maxDiscount ? Number(t.maxDiscount) : undefined,
      })),
      gifts: p.gifts.map((g) => ({
        triggerMinSubtotal: g.triggerMinSubtotal ? Number(g.triggerMinSubtotal) : undefined,
        giftVariantId: g.giftVariantId,
        giftQty: g.giftQty,
        maxGiftsPerOrder: g.maxGiftsPerOrder || undefined,
      })),
    };
  });
}
