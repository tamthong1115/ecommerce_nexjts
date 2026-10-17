import { prisma } from '@/lib/db';
import { PromotionKind, PromotionTarget, SponsorType, OwnerType } from '@prisma/client';

export async function migrateVouchersToPromotions() {
  console.log('🚀 Starting voucher migration to promotions...');

  const vouchers = await prisma.voucher.findMany({
    include: {
      categories: true,
      products: true,
    },
  });

  console.log(`Found ${vouchers.length} vouchers to migrate.`);

  let migratedCount = 0;

  for (const v of vouchers) {
    const existing = await prisma.promotion.findUnique({
      where: { code: v.code },
    });

    if (existing) {
      console.log(`Promotion code ${v.code} already exists, skipping.`);
      continue;
    }

    let kind: PromotionKind = 'PERCENT_OFF';
    if (v.type === 'PERCENT') kind = 'PERCENT_OFF';
    else if (v.type === 'FIXED') kind = 'FIXED_OFF';
    else if (v.type === 'SHIPPING') kind = 'SHIPPING_OFF';

    let target: PromotionTarget = 'CART';
    if (v.type === 'SHIPPING') target = 'SHIPPING';
    else if (v.shopId) target = 'SHOP_ORDER';

    const ownerType: OwnerType = v.shopId ? 'SHOP' : 'PLATFORM';
    const sponsor: SponsorType = v.shopId ? 'SHOP' : 'PLATFORM';

    const percentage = v.type === 'PERCENT' ? v.value : null;
    const fixedAmount = v.type !== 'PERCENT' ? v.value : null;

    const promotion = await prisma.promotion.create({
      data: {
        code: v.code,
        name: `Voucher ${v.code}`,
        description: `Migrated from legacy voucher ${v.code}`,
        kind,
        target,
        ownerType,
        shopId: v.shopId,
        sponsor,
        platformSharePct: ownerType === 'PLATFORM' ? 100 : 0,
        requiresCode: true,
        startAt: v.startAt,
        endAt: v.endAt,
        status: v.isActive ? 'ACTIVE' : 'PAUSED',
        minSubtotal: v.minSubtotal,
        currency: v.currency,
        percentage,
        fixedAmount,
        maxDiscount: v.maxDiscount,
        usageLimit: v.usageLimit,
        perUserLimit: v.perUserLimit || 1,
        stackMode: 'STACKABLE',
        priority: 100,
        reducesTaxBase: ownerType === 'SHOP',
        scopes: {
          create: [
            ...v.products.map((p) => ({
              scopeType: 'PRODUCT',
              targetId: p.productId,
              isExcluded: false,
            })),
            ...v.categories.map((c) => ({
              scopeType: 'CATEGORY',
              targetId: c.categoryId,
              isExcluded: false,
            })),
          ],
        },
      },
    });

    migratedCount++;
    console.log(`Migrated voucher ${v.code} -> promotion ID: ${promotion.id}`);
  }

  console.log(`✅ Successfully migrated ${migratedCount}/${vouchers.length} vouchers to promotions.`);
}

if (require.main === module) {
  migrateVouchersToPromotions()
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
