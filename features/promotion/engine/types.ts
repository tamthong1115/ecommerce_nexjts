export type PromotionKind =
  | 'PERCENT_OFF'
  | 'FIXED_OFF'
  | 'SHIPPING_OFF'
  | 'TIERED'
  | 'GIFT'
  | 'PRICE_OVERRIDE';

export type PromotionTarget = 'ITEM' | 'SHOP_ORDER' | 'CART' | 'SHIPPING';
export type SponsorType = 'PLATFORM' | 'SHOP' | 'SPLIT';
export type OwnerType = 'PLATFORM' | 'SHOP';
export type StackMode = 'EXCLUSIVE' | 'STACKABLE';
export type TierMode = 'WHOLE' | 'MARGINAL';
export type TierMetric = 'SUBTOTAL' | 'QUANTITY';

export interface PromotionTierRule {
  from: number;
  to?: number;
  benefitType: 'PERCENT' | 'FIXED' | 'GIFT';
  value: number;
  maxDiscount?: number;
  giftVariantId?: string;
  giftQty?: number;
}

export interface PromotionGiftRule {
  triggerMinSubtotal?: number;
  triggerVariantId?: string;
  triggerMinQty?: number;
  giftVariantId: string;
  giftQty: number;
  maxGiftsPerOrder?: number;
}

export interface PromotionScopeRule {
  includedProductIds?: string[];
  excludedProductIds?: string[];
  includedCategoryIds?: string[];
  excludedCategoryIds?: string[];
  includedVariantIds?: string[];
  excludedVariantIds?: string[];
  includedShopIds?: string[];
  excludedShopIds?: string[];
  excludeFlashSaleItems?: boolean;
}

export interface PromotionRule {
  id: string;
  code?: string;
  name: string;
  kind: PromotionKind;
  target: PromotionTarget;
  ownerType: OwnerType;
  shopId?: string | null;
  sponsor: SponsorType;
  platformSharePct?: number;

  requiresCode: boolean;
  startAt: Date | string;
  endAt: Date | string;
  minSubtotal?: number;
  minQuantity?: number;
  currency: 'VND' | 'USD';

  percentage?: number;
  fixedAmount?: number;
  maxDiscount?: number;
  overridePrice?: number;
  stockLimit?: number;
  usageLimit?: number;
  perUserLimit?: number;

  stackMode: StackMode;
  stackGroupId?: string;
  incompatibleKinds?: PromotionKind[];
  incompatiblePromotionIds?: string[];
  incompatibleGroupIds?: string[];
  allowedGroupIds?: string[];
  priority: number;
  reducesTaxBase: boolean;

  scope?: PromotionScopeRule;
  tiers?: PromotionTierRule[];
  tierMode?: TierMode;
  tierMetric?: TierMetric;
  gifts?: PromotionGiftRule[];
}

export interface CartItemInput {
  id: string;
  productId: string;
  variantId: string;
  shopId: string;
  categoryId?: string;
  title: string;
  originalUnitPrice: number;
  quantity: number;
  taxRate: number;
  isGift?: boolean;
}

export interface ShopShippingInput {
  shopId: string;
  originalFee: number;
  taxRate?: number;
}

export interface CartInput {
  items: CartItemInput[];
  shipping: ShopShippingInput[];
  appliedCodes: string[];
  availablePromotions: PromotionRule[];
  currency: 'VND' | 'USD';
  customerId?: string;
  isFirstOrder?: boolean;
  userRedemptionCounts?: Record<string, number>;
}

export interface AppliedPromotionRecord {
  promotionId: string;
  code?: string;
  name: string;
  kind: PromotionKind;
  target: PromotionTarget;
  sponsor: SponsorType;
  platformShare: number;
  shopShare: number;
  totalDiscount: number;
  appliedToItemIds?: string[];
  appliedToShopIds?: string[];
}

export interface ItemPricingBreakdown {
  itemId: string;
  variantId: string;
  shopId: string;
  quantity: number;
  originalUnitPrice: number;
  effectiveUnitPrice: number;
  originalTotal: number;
  discountTotal: number;
  grossTotal: number;
  netTotal: number;
  taxAmount: number;
  taxRate: number;
  isGift: boolean;
  appliedPromotions: {
    promotionId: string;
    discountAmount: number;
  }[];
}

export interface TaxGroupBreakdown {
  taxRate: number;
  taxBaseGross: number;
  netAmount: number;
  taxAmount: number;
}

export interface PricingResult {
  items: ItemPricingBreakdown[];
  shopSummary: Record<string, {
    itemsTotalGross: number;
    itemsTotalNet: number;
    itemsTax: number;
    shippingFeeGross: number;
    shippingFeeNet: number;
    shippingDiscount: number;
    shopDiscount: number;
    platformDiscount: number;
    grandTotal: number;
  }>;
  taxBreakdown: TaxGroupBreakdown[];
  appliedPromotions: AppliedPromotionRecord[];
  rejectedPromotions: {
    promotionId: string;
    code?: string;
    reason: string;
  }[];
  giftsToAdd: {
    variantId: string;
    quantity: number;
    promotionId: string;
  }[];
  summary: {
    itemsTotalGross: number;
    itemsTotalNet: number;
    taxTotal: number;
    shippingFeeOriginal: number;
    shippingFeeDiscount: number;
    shippingFeeFinal: number;
    discountTotal: number;
    grandTotal: number;
  };
}
