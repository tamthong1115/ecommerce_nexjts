import { CartItemInput, PromotionRule } from './types';

export interface BenefitCalculationResult {
  discountAmount: number;
  itemDiscounts: Record<string, number>;
  giftsToAdd?: { variantId: string; quantity: number; promotionId: string }[];
}

export function calculateBenefit(
  promo: PromotionRule,
  context: {
    items: { item: CartItemInput; currentGross: number }[];
    shippingTotal: number;
  }
): BenefitCalculationResult {
  const itemDiscounts: Record<string, number> = {};

  switch (promo.kind) {
    case 'PRICE_OVERRIDE': {
      let total = 0;
      for (const { item, currentGross } of context.items) {
        if (promo.overridePrice !== undefined && promo.overridePrice < item.originalUnitPrice) {
          const discountPerUnit = item.originalUnitPrice - promo.overridePrice;
          const lineDiscount = Math.min(discountPerUnit * item.quantity, currentGross);
          itemDiscounts[item.id] = lineDiscount;
          total += lineDiscount;
        }
      }
      return { discountAmount: total, itemDiscounts };
    }

    case 'PERCENT_OFF': {
      const eligibleSubtotal = context.items.reduce((sum, i) => sum + i.currentGross, 0);
      let total = (eligibleSubtotal * (promo.percentage || 0)) / 100;
      if (promo.maxDiscount && total > promo.maxDiscount) {
        total = promo.maxDiscount;
      }
      total = Math.min(total, eligibleSubtotal);
      return { discountAmount: total, itemDiscounts };
    }

    case 'FIXED_OFF': {
      const eligibleSubtotal = context.items.reduce((sum, i) => sum + i.currentGross, 0);
      const total = Math.min(promo.fixedAmount || 0, eligibleSubtotal);
      return { discountAmount: total, itemDiscounts };
    }

    case 'TIERED': {
      return calculateTieredBenefit(promo, context.items);
    }

    case 'SHIPPING_OFF': {
      let discount = promo.fixedAmount || 0;
      if (promo.percentage) {
        discount = (context.shippingTotal * promo.percentage) / 100;
      }
      if (promo.maxDiscount) {
        discount = Math.min(discount, promo.maxDiscount);
      }
      discount = Math.min(discount, context.shippingTotal);
      return { discountAmount: discount, itemDiscounts: {} };
    }

    case 'GIFT': {
      const gifts: { variantId: string; quantity: number; promotionId: string }[] = [];
      if (promo.gifts && promo.gifts.length > 0) {
        for (const g of promo.gifts) {
          gifts.push({
            variantId: g.giftVariantId,
            quantity: g.giftQty,
            promotionId: promo.id,
          });
        }
      }
      return { discountAmount: 0, itemDiscounts: {}, giftsToAdd: gifts };
    }

    default:
      return { discountAmount: 0, itemDiscounts: {} };
  }
}

function calculateTieredBenefit(
  promo: PromotionRule,
  items: { item: CartItemInput; currentGross: number }[]
): BenefitCalculationResult {
  const tiers = promo.tiers || [];
  if (tiers.length === 0) return { discountAmount: 0, itemDiscounts: {} };

  const subtotal = items.reduce((sum, i) => sum + i.currentGross, 0);
  const totalQty = items.reduce((sum, i) => sum + i.item.quantity, 0);
  const metricValue = promo.tierMetric === 'QUANTITY' ? totalQty : subtotal;
  const isMarginal = promo.tierMode === 'MARGINAL';

  const sorted = [...tiers].sort((a, b) => a.from - b.from);

  if (isMarginal) {
    let totalDiscount = 0;
    const gifts: { variantId: string; quantity: number; promotionId: string }[] = [];

    for (const tier of sorted) {
      if (metricValue < tier.from) continue;
      const upper = tier.to !== undefined ? Math.min(metricValue, tier.to) : metricValue;
      const bracketAmount = Math.max(0, upper - tier.from);

      let bracketDiscount = 0;
      if (tier.benefitType === 'PERCENT') {
        bracketDiscount = (bracketAmount * tier.value) / 100;
      } else if (tier.benefitType === 'FIXED') {
        bracketDiscount = tier.value;
      } else if (tier.benefitType === 'GIFT' && tier.giftVariantId) {
        gifts.push({
          variantId: tier.giftVariantId,
          quantity: tier.giftQty || 1,
          promotionId: promo.id,
        });
      }

      if (tier.maxDiscount && bracketDiscount > tier.maxDiscount) {
        bracketDiscount = tier.maxDiscount;
      }
      totalDiscount += bracketDiscount;
    }

    totalDiscount = Math.min(totalDiscount, subtotal);
    return { discountAmount: totalDiscount, itemDiscounts: {}, giftsToAdd: gifts };
  }

  // WHOLE mode: áp dụng bậc cao nhất đạt được cho toàn bộ
  const highestMatched = sorted.filter((t) => metricValue >= t.from).pop();
  if (!highestMatched) return { discountAmount: 0, itemDiscounts: {} };

  let discount = 0;
  const gifts: { variantId: string; quantity: number; promotionId: string }[] = [];

  if (highestMatched.benefitType === 'PERCENT') {
    discount = (subtotal * highestMatched.value) / 100;
  } else if (highestMatched.benefitType === 'FIXED') {
    discount = highestMatched.value;
  } else if (highestMatched.benefitType === 'GIFT' && highestMatched.giftVariantId) {
    gifts.push({
      variantId: highestMatched.giftVariantId,
      quantity: highestMatched.giftQty || 1,
      promotionId: promo.id,
    });
  }

  if (highestMatched.maxDiscount && discount > highestMatched.maxDiscount) {
    discount = highestMatched.maxDiscount;
  }
  discount = Math.min(discount, subtotal);

  return { discountAmount: discount, itemDiscounts: {}, giftsToAdd: gifts };
}
