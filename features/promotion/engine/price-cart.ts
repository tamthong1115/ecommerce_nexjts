import {
  AppliedPromotionRecord,
  CartInput,
  CartItemInput,
  ItemPricingBreakdown,
  PricingResult,
  PromotionRule,
  ShopShippingInput,
} from './types';
import { allocateLargestRemainder } from './allocate';
import { buildTaxBreakdown, computeTaxFromGross } from './tax';
import { checkEligibility } from './eligibility';
import { calculateBenefit } from './benefits';
import { selectOptimalPromotionSet } from './stacking';

export function priceCart(input: CartInput, now = new Date()): PricingResult {
  const isZeroDecimal = input.currency === 'VND';

  const itemGrossMap = new Map<string, number>();
  const itemDiscountsMap = new Map<string, { promoId: string; amount: number }[]>();
  const flashSaleItemIds = new Set<string>();

  for (const item of input.items) {
    const originalTotal = item.originalUnitPrice * item.quantity;
    itemGrossMap.set(item.id, originalTotal);
    itemDiscountsMap.set(item.id, []);
  }

  const shopShippingMap = new Map<string, number>();
  for (const s of input.shipping) {
    shopShippingMap.set(s.shopId, s.originalFee);
  }

  const rejectedPromotions: { promotionId: string; code?: string; reason: string }[] = [];
  const candidateList: { promo: PromotionRule; benefit: number; eligibleItemIds: string[] }[] = [];

  for (const promo of input.availablePromotions) {
    const eligibility = checkEligibility(promo, input, itemGrossMap, flashSaleItemIds, now);
    if (!eligibility.isEligible) {
      if (promo.requiresCode && promo.code && input.appliedCodes.includes(promo.code)) {
        rejectedPromotions.push({
          promotionId: promo.id,
          code: promo.code,
          reason: eligibility.reason || 'Không đủ điều kiện',
        });
      }
      continue;
    }

    const scopedItems = input.items
      .filter((i) => eligibility.eligibleItemIds.includes(i.id))
      .map((item) => ({ item, currentGross: itemGrossMap.get(item.id) || 0 }));

    const shippingTotal = Array.from(shopShippingMap.values()).reduce((a, b) => a + b, 0);
    const benefitResult = calculateBenefit(promo, { items: scopedItems, shippingTotal });

    if (benefitResult.discountAmount > 0 || (benefitResult.giftsToAdd && benefitResult.giftsToAdd.length > 0)) {
      candidateList.push({
        promo,
        benefit: benefitResult.discountAmount,
        eligibleItemIds: eligibility.eligibleItemIds,
      });
    } else if (promo.requiresCode && promo.code && input.appliedCodes.includes(promo.code)) {
      rejectedPromotions.push({
        promotionId: promo.id,
        code: promo.code,
        reason: 'Không áp dụng được mức giảm giá nào cho giỏ hàng hiện tại',
      });
    }
  }

  const selectedPromotions = selectOptimalPromotionSet(
    candidateList.map((c) => ({ promo: c.promo, benefit: c.benefit }))
  );

  for (const cand of candidateList) {
    if (!selectedPromotions.some((s) => s.id === cand.promo.id)) {
      rejectedPromotions.push({
        promotionId: cand.promo.id,
        code: cand.promo.code,
        reason: 'Xung đột hoặc không thể cộng dồn với khuyến mãi tối ưu hơn',
      });
    }
  }

  const appliedPromotions: AppliedPromotionRecord[] = [];
  const giftsToAdd: { variantId: string; quantity: number; promotionId: string }[] = [];

  const flashSalePromos = selectedPromotions
    .filter((p) => p.kind === 'PRICE_OVERRIDE')
    .sort((a, b) => a.priority - b.priority);

  for (const promo of flashSalePromos) {
    const cand = candidateList.find((c) => c.promo.id === promo.id);
    if (!cand) continue;

    const scopedItems = input.items
      .filter((i) => cand.eligibleItemIds.includes(i.id))
      .map((item) => ({ item, currentGross: itemGrossMap.get(item.id) || 0 }));

    const res = calculateBenefit(promo, { items: scopedItems, shippingTotal: 0 });
    let totalDiscount = 0;

    for (const [itemId, discount] of Object.entries(res.itemDiscounts)) {
      if (discount <= 0) continue;
      const current = itemGrossMap.get(itemId) || 0;
      const applied = Math.min(discount, current);
      itemGrossMap.set(itemId, current - applied);
      itemDiscountsMap.get(itemId)?.push({ promoId: promo.id, amount: applied });
      flashSaleItemIds.add(itemId);
      totalDiscount += applied;
    }

    if (totalDiscount > 0) {
      appliedPromotions.push(createAppliedRecord(promo, totalDiscount, Object.keys(res.itemDiscounts)));
    }
  }

  const itemLevelPromos = selectedPromotions
    .filter((p) => p.kind !== 'PRICE_OVERRIDE' && p.target === 'ITEM')
    .sort((a, b) => a.priority - b.priority);

  for (const promo of itemLevelPromos) {
    const cand = candidateList.find((c) => c.promo.id === promo.id);
    if (!cand) continue;

    const scopedItems = input.items
      .filter((i) => cand.eligibleItemIds.includes(i.id))
      .map((item) => ({ item, currentGross: itemGrossMap.get(item.id) || 0 }));

    const res = calculateBenefit(promo, { items: scopedItems, shippingTotal: 0 });
    let totalDiscount = 0;

    if (Object.keys(res.itemDiscounts).length > 0) {
      for (const [itemId, discount] of Object.entries(res.itemDiscounts)) {
        const current = itemGrossMap.get(itemId) || 0;
        const applied = Math.min(discount, current);
        itemGrossMap.set(itemId, current - applied);
        itemDiscountsMap.get(itemId)?.push({ promoId: promo.id, amount: applied });
        totalDiscount += applied;
      }
    } else if (res.discountAmount > 0) {
      const weights = scopedItems.map((s) => ({ id: s.item.id, weight: s.currentGross }));
      const allocations = allocateLargestRemainder(res.discountAmount, weights, isZeroDecimal);
      for (const [itemId, amount] of Object.entries(allocations)) {
        const current = itemGrossMap.get(itemId) || 0;
        const applied = Math.min(amount, current);
        itemGrossMap.set(itemId, current - applied);
        itemDiscountsMap.get(itemId)?.push({ promoId: promo.id, amount: applied });
        totalDiscount += applied;
      }
    }

    if (res.giftsToAdd) giftsToAdd.push(...res.giftsToAdd);
    if (totalDiscount > 0) {
      appliedPromotions.push(createAppliedRecord(promo, totalDiscount, cand.eligibleItemIds));
    }
  }

  const shopLevelPromos = selectedPromotions
    .filter((p) => p.target === 'SHOP_ORDER')
    .sort((a, b) => a.priority - b.priority);

  for (const promo of shopLevelPromos) {
    const cand = candidateList.find((c) => c.promo.id === promo.id);
    if (!cand) continue;

    const scopedItems = input.items
      .filter((i) => cand.eligibleItemIds.includes(i.id))
      .map((item) => ({ item, currentGross: itemGrossMap.get(item.id) || 0 }));

    const res = calculateBenefit(promo, { items: scopedItems, shippingTotal: 0 });
    if (res.discountAmount <= 0 && (!res.giftsToAdd || res.giftsToAdd.length === 0)) continue;

    let totalDiscount = 0;
    if (res.discountAmount > 0) {
      const weights = scopedItems.map((s) => ({ id: s.item.id, weight: s.currentGross }));
      const allocations = allocateLargestRemainder(res.discountAmount, weights, isZeroDecimal);
      for (const [itemId, amount] of Object.entries(allocations)) {
        const current = itemGrossMap.get(itemId) || 0;
        const applied = Math.min(amount, current);
        itemGrossMap.set(itemId, current - applied);
        itemDiscountsMap.get(itemId)?.push({ promoId: promo.id, amount: applied });
        totalDiscount += applied;
      }
    }

    if (res.giftsToAdd) giftsToAdd.push(...res.giftsToAdd);
    if (totalDiscount > 0 || (res.giftsToAdd && res.giftsToAdd.length > 0)) {
      appliedPromotions.push(createAppliedRecord(promo, totalDiscount, cand.eligibleItemIds, promo.shopId ? [promo.shopId] : []));
    }
  }

  const cartLevelPromos = selectedPromotions
    .filter((p) => p.target === 'CART')
    .sort((a, b) => a.priority - b.priority);

  for (const promo of cartLevelPromos) {
    const cand = candidateList.find((c) => c.promo.id === promo.id);
    if (!cand) continue;

    const scopedItems = input.items
      .filter((i) => cand.eligibleItemIds.includes(i.id))
      .map((item) => ({ item, currentGross: itemGrossMap.get(item.id) || 0 }));

    const res = calculateBenefit(promo, { items: scopedItems, shippingTotal: 0 });
    if (res.discountAmount <= 0 && (!res.giftsToAdd || res.giftsToAdd.length === 0)) continue;

    let totalDiscount = 0;
    if (res.discountAmount > 0) {
      const weights = scopedItems.map((s) => ({ id: s.item.id, weight: s.currentGross }));
      const allocations = allocateLargestRemainder(res.discountAmount, weights, isZeroDecimal);
      for (const [itemId, amount] of Object.entries(allocations)) {
        const current = itemGrossMap.get(itemId) || 0;
        const applied = Math.min(amount, current);
        itemGrossMap.set(itemId, current - applied);
        itemDiscountsMap.get(itemId)?.push({ promoId: promo.id, amount: applied });
        totalDiscount += applied;
      }
    }

    if (res.giftsToAdd) giftsToAdd.push(...res.giftsToAdd);
    if (totalDiscount > 0 || (res.giftsToAdd && res.giftsToAdd.length > 0)) {
      appliedPromotions.push(createAppliedRecord(promo, totalDiscount, cand.eligibleItemIds));
    }
  }

  const shippingPromos = selectedPromotions
    .filter((p) => p.target === 'SHIPPING' || p.kind === 'SHIPPING_OFF')
    .sort((a, b) => a.priority - b.priority);

  const shopShippingDiscounts = new Map<string, number>();
  for (const s of input.shipping) {
    shopShippingDiscounts.set(s.shopId, 0);
  }

  for (const promo of shippingPromos) {
    let targetShopIds = input.shipping.map((s) => s.shopId);
    if (promo.shopId) {
      targetShopIds = targetShopIds.filter((id) => id === promo.shopId);
    }

    const availableShippingTotal = targetShopIds.reduce((sum, id) => {
      const original = shopShippingMap.get(id) || 0;
      const currentDiscount = shopShippingDiscounts.get(id) || 0;
      return sum + Math.max(0, original - currentDiscount);
    }, 0);

    if (availableShippingTotal <= 0) continue;

    const res = calculateBenefit(promo, { items: [], shippingTotal: availableShippingTotal });
    if (res.discountAmount <= 0) continue;

    const shippingWeights = targetShopIds.map((id) => ({
      id,
      weight: Math.max(0, (shopShippingMap.get(id) || 0) - (shopShippingDiscounts.get(id) || 0)),
    }));

    const allocations = allocateLargestRemainder(res.discountAmount, shippingWeights, isZeroDecimal);
    let totalDiscount = 0;

    for (const [shopId, amount] of Object.entries(allocations)) {
      const current = shopShippingDiscounts.get(shopId) || 0;
      const maxAllowed = (shopShippingMap.get(shopId) || 0) - current;
      const applied = Math.min(amount, maxAllowed);
      shopShippingDiscounts.set(shopId, current + applied);
      totalDiscount += applied;
    }

    if (totalDiscount > 0) {
      appliedPromotions.push(createAppliedRecord(promo, totalDiscount, undefined, targetShopIds));
    }
  }

  const lineBreakdowns: ItemPricingBreakdown[] = [];
  for (const item of input.items) {
    const originalTotal = item.originalUnitPrice * item.quantity;
    const grossTotal = itemGrossMap.get(item.id) || 0;
    const discountTotal = originalTotal - grossTotal;
    const effectiveUnitPrice = item.quantity > 0 ? grossTotal / item.quantity : 0;
    const { net, tax } = computeTaxFromGross(grossTotal, item.taxRate, isZeroDecimal);

    lineBreakdowns.push({
      itemId: item.id,
      variantId: item.variantId,
      shopId: item.shopId,
      quantity: item.quantity,
      originalUnitPrice: item.originalUnitPrice,
      effectiveUnitPrice: isZeroDecimal ? Math.round(effectiveUnitPrice) : Math.round(effectiveUnitPrice * 100) / 100,
      originalTotal,
      discountTotal,
      grossTotal,
      netTotal: net,
      taxAmount: tax,
      taxRate: item.taxRate,
      isGift: !!item.isGift,
      appliedPromotions: (itemDiscountsMap.get(item.id) || []).map((d) => ({
        promotionId: d.promoId,
        discountAmount: d.amount,
      })),
    });
  }

  const shopSummary: PricingResult['shopSummary'] = {};
  for (const s of input.shipping) {
    const shopItems = lineBreakdowns.filter((i) => i.shopId === s.shopId);
    const itemsTotalGross = shopItems.reduce((sum, i) => sum + i.grossTotal, 0);
    const itemsTotalNet = shopItems.reduce((sum, i) => sum + i.netTotal, 0);
    const itemsTax = shopItems.reduce((sum, i) => sum + i.taxAmount, 0);

    const shippingFeeOriginal = shopShippingMap.get(s.shopId) || 0;
    const shippingDiscount = shopShippingDiscounts.get(s.shopId) || 0;
    const shippingFeeGross = Math.max(0, shippingFeeOriginal - shippingDiscount);
    const shippingTaxRate = s.taxRate || 0;
    const { net: shippingFeeNet } = computeTaxFromGross(shippingFeeGross, shippingTaxRate, isZeroDecimal);

    const shopDiscount = appliedPromotions
      .filter((p) => p.sponsor === 'SHOP' && (!p.appliedToShopIds || p.appliedToShopIds.includes(s.shopId)))
      .reduce((sum, p) => sum + p.shopShare, 0);

    const platformDiscount = appliedPromotions
      .filter((p) => p.sponsor !== 'SHOP' && (!p.appliedToShopIds || p.appliedToShopIds.includes(s.shopId)))
      .reduce((sum, p) => sum + p.platformShare, 0);

    const grandTotal = itemsTotalGross + shippingFeeGross;

    shopSummary[s.shopId] = {
      itemsTotalGross,
      itemsTotalNet,
      itemsTax,
      shippingFeeGross,
      shippingFeeNet,
      shippingDiscount,
      shopDiscount,
      platformDiscount,
      grandTotal,
    };
  }

  const taxBreakdown = buildTaxBreakdown(
    lineBreakdowns.map((l) => ({
      grossTotal: l.grossTotal,
      netTotal: l.netTotal,
      taxAmount: l.taxAmount,
      taxRate: l.taxRate,
    }))
  );

  const itemsTotalGross = lineBreakdowns.reduce((sum, i) => sum + i.grossTotal, 0);
  const itemsTotalNet = lineBreakdowns.reduce((sum, i) => sum + i.netTotal, 0);
  const taxTotal = lineBreakdowns.reduce((sum, i) => sum + i.taxAmount, 0);
  const shippingFeeOriginal = Array.from(shopShippingMap.values()).reduce((a, b) => a + b, 0);
  const shippingFeeDiscount = Array.from(shopShippingDiscounts.values()).reduce((a, b) => a + b, 0);
  const shippingFeeFinal = Math.max(0, shippingFeeOriginal - shippingFeeDiscount);
  const discountTotal = lineBreakdowns.reduce((sum, i) => sum + i.discountTotal, 0) + shippingFeeDiscount;
  const grandTotal = itemsTotalGross + shippingFeeFinal;

  return {
    items: lineBreakdowns,
    shopSummary,
    taxBreakdown,
    appliedPromotions,
    rejectedPromotions,
    giftsToAdd,
    summary: {
      itemsTotalGross,
      itemsTotalNet,
      taxTotal,
      shippingFeeOriginal,
      shippingFeeDiscount,
      shippingFeeFinal,
      discountTotal,
      grandTotal,
    },
  };
}

function createAppliedRecord(
  promo: PromotionRule,
  discount: number,
  itemIds?: string[],
  shopIds?: string[]
): AppliedPromotionRecord {
  let platformShare = 0;
  let shopShare = 0;

  if (promo.sponsor === 'PLATFORM') {
    platformShare = discount;
  } else if (promo.sponsor === 'SHOP') {
    shopShare = discount;
  } else if (promo.sponsor === 'SPLIT') {
    const pct = promo.platformSharePct ?? 50;
    platformShare = Math.round((discount * pct) / 100);
    shopShare = discount - platformShare;
  }

  return {
    promotionId: promo.id,
    code: promo.code,
    name: promo.name,
    kind: promo.kind,
    target: promo.target,
    sponsor: promo.sponsor,
    platformShare,
    shopShare,
    totalDiscount: discount,
    appliedToItemIds: itemIds,
    appliedToShopIds: shopIds,
  };
}
