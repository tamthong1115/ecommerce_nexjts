import { DbClient } from '@/types/api';
import { getAvailablePromotionsForCart } from '../services/promotion.service';
import { priceCart } from '../engine/price-cart';
import { CartInput, CartItemInput, PricingResult, ShopShippingInput } from '../engine/types';

export interface PriceCheckoutInput {
  items: {
    id: string;
    productId: string;
    variantId: string;
    shopId: string;
    categoryId?: string;
    title: string;
    originalUnitPrice: number;
    quantity: number;
    taxRate?: number;
  }[];
  shippingRates: {
    shopId: string;
    fee: number;
    taxRate?: number;
  }[];
  appliedCodes: string[];
  userId?: string;
  currency?: 'VND' | 'USD';
}

export async function priceCheckoutUsecase(
  db: DbClient,
  input: PriceCheckoutInput
): Promise<PricingResult> {
  const shopIds = Array.from(new Set(input.items.map((i) => i.shopId)));
  const currency = input.currency || 'VND';

  const availablePromotions = await getAvailablePromotionsForCart(db, {
    shopIds,
    appliedCodes: input.appliedCodes,
  });

  let userRedemptionCounts: Record<string, number> = {};
  if (input.userId && availablePromotions.length > 0) {
    const promoIds = availablePromotions.map((p) => p.id);
    const redemptions = await db.promotionRedemption.groupBy({
      by: ['promotionId'],
      where: {
        userId: input.userId,
        promotionId: { in: promoIds },
        status: { in: ['RESERVED', 'COMMITTED'] },
      },
      _count: { id: true },
    });

    for (const r of redemptions) {
      userRedemptionCounts[r.promotionId] = r._count.id;
    }
  }

  const cartItems: CartItemInput[] = input.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    variantId: i.variantId,
    shopId: i.shopId,
    categoryId: i.categoryId,
    title: i.title,
    originalUnitPrice: i.originalUnitPrice,
    quantity: i.quantity,
    taxRate: i.taxRate !== undefined ? i.taxRate : 0.1,
  }));

  const shippingInputs: ShopShippingInput[] = input.shippingRates.map((s) => ({
    shopId: s.shopId,
    originalFee: s.fee,
    taxRate: s.taxRate || 0,
  }));

  const cartInput: CartInput = {
    items: cartItems,
    shipping: shippingInputs,
    appliedCodes: input.appliedCodes,
    availablePromotions,
    currency,
    customerId: input.userId,
    userRedemptionCounts,
  };

  return priceCart(cartInput);
}
