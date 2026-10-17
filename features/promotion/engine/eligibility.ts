import { CartInput, CartItemInput, PromotionRule } from './types';

export interface EligibilityResult {
  isEligible: boolean;
  reason?: string;
  eligibleItemIds: string[];
}

export function isItemInScope(
  item: CartItemInput,
  promo: PromotionRule,
  options?: { isFlashSaleItem?: boolean }
): boolean {
  if (promo.shopId && item.shopId !== promo.shopId) {
    return false;
  }

  const scope = promo.scope;
  if (!scope) return true;

  if (scope.excludeFlashSaleItems && options?.isFlashSaleItem) {
    return false;
  }

  if (scope.excludedShopIds?.includes(item.shopId)) return false;
  if (scope.includedShopIds && scope.includedShopIds.length > 0 && !scope.includedShopIds.includes(item.shopId)) {
    return false;
  }

  if (scope.excludedProductIds?.includes(item.productId)) return false;
  if (scope.includedProductIds && scope.includedProductIds.length > 0 && !scope.includedProductIds.includes(item.productId)) {
    return false;
  }

  if (scope.excludedVariantIds?.includes(item.variantId)) return false;
  if (scope.includedVariantIds && scope.includedVariantIds.length > 0 && !scope.includedVariantIds.includes(item.variantId)) {
    return false;
  }

  if (item.categoryId) {
    if (scope.excludedCategoryIds?.includes(item.categoryId)) return false;
    if (scope.includedCategoryIds && scope.includedCategoryIds.length > 0 && !scope.includedCategoryIds.includes(item.categoryId)) {
      return false;
    }
  }

  return true;
}

export function checkEligibility(
  promo: PromotionRule,
  cart: CartInput,
  currentGrossMap: Map<string, number>,
  flashSaleItemIds: Set<string>,
  now = new Date()
): EligibilityResult {
  const start = new Date(promo.startAt);
  const end = new Date(promo.endAt);

  if (now < start) {
    return { isEligible: false, reason: 'Chương trình khuyến mãi chưa bắt đầu', eligibleItemIds: [] };
  }

  if (now > end) {
    return { isEligible: false, reason: 'Chương trình khuyến mãi đã kết thúc', eligibleItemIds: [] };
  }

  if (promo.currency !== cart.currency) {
    return { isEligible: false, reason: `Đơn vị tiền tệ không khớp (${promo.currency})`, eligibleItemIds: [] };
  }

  if (promo.requiresCode) {
    const isCodeProvided = promo.code && cart.appliedCodes.some(
      (c) => c.trim().toUpperCase() === promo.code!.trim().toUpperCase()
    );
    if (!isCodeProvided) {
      return { isEligible: false, reason: 'Yêu cầu nhập mã khuyến mãi', eligibleItemIds: [] };
    }
  }

  if (cart.userRedemptionCounts && promo.id in cart.userRedemptionCounts) {
    const used = cart.userRedemptionCounts[promo.id];
    const limit = promo.perUserLimit ?? 1;
    if (used >= limit) {
      return { isEligible: false, reason: 'Bạn đã dùng hết số lượt của khuyến mãi này', eligibleItemIds: [] };
    }
  }

  const eligibleItems = cart.items.filter((item) =>
    isItemInScope(item, promo, { isFlashSaleItem: flashSaleItemIds.has(item.id) })
  );

  if (promo.target !== 'SHIPPING' && eligibleItems.length === 0) {
    return { isEligible: false, reason: 'Không có sản phẩm nào trong phạm vi áp dụng', eligibleItemIds: [] };
  }

  const eligibleSubtotal = eligibleItems.reduce(
    (sum, item) => sum + (currentGrossMap.get(item.id) ?? item.originalUnitPrice * item.quantity),
    0
  );
  const eligibleQuantity = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);

  if (promo.minSubtotal && eligibleSubtotal < promo.minSubtotal) {
    return {
      isEligible: false,
      reason: `Chưa đạt giá trị đơn tối thiểu (${promo.minSubtotal.toLocaleString()} ${promo.currency})`,
      eligibleItemIds: eligibleItems.map((i) => i.id),
    };
  }

  if (promo.minQuantity && eligibleQuantity < promo.minQuantity) {
    return {
      isEligible: false,
      reason: `Chưa đạt số lượng tối thiểu (${promo.minQuantity} sản phẩm)`,
      eligibleItemIds: eligibleItems.map((i) => i.id),
    };
  }

  return {
    isEligible: true,
    eligibleItemIds: eligibleItems.map((i) => i.id),
  };
}
