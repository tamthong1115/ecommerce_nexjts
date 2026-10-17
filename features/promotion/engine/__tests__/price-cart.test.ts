// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { priceCart } from '../price-cart';
import { CartInput, PromotionRule } from '../types';

describe('priceCart pipeline', () => {
  it('calculates shipping fee strictly per shop without duplicate charges', () => {
    const input: CartInput = {
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          shopId: 'shop-A',
          title: 'Product A',
          originalUnitPrice: 100000,
          quantity: 2,
          taxRate: 0.1,
        },
        {
          id: 'item-2',
          productId: 'prod-2',
          variantId: 'var-2',
          shopId: 'shop-B',
          title: 'Product B',
          originalUnitPrice: 150000,
          quantity: 1,
          taxRate: 0.1,
        },
      ],
      shipping: [
        { shopId: 'shop-A', originalFee: 30000 },
        { shopId: 'shop-B', originalFee: 40000 },
      ],
      appliedCodes: [],
      availablePromotions: [],
      currency: 'VND',
    };

    const result = priceCart(input);

    expect(result.summary.itemsTotalGross).toBe(350000);
    expect(result.summary.shippingFeeOriginal).toBe(70000);
    expect(result.summary.grandTotal).toBe(420000);

    expect(result.shopSummary['shop-A'].shippingFeeGross).toBe(30000);
    expect(result.shopSummary['shop-B'].shippingFeeGross).toBe(40000);
    expect(result.shopSummary['shop-A'].grandTotal).toBe(230000);
    expect(result.shopSummary['shop-B'].grandTotal).toBe(190000);
  });

  it('applies shop voucher and platform voucher together with exact allocation', () => {
    const shopVoucher: PromotionRule = {
      id: 'shop-voucher-1',
      code: 'SHOP10',
      name: 'Shop 10% Off',
      kind: 'PERCENT_OFF',
      target: 'SHOP_ORDER',
      ownerType: 'SHOP',
      shopId: 'shop-A',
      sponsor: 'SHOP',
      requiresCode: true,
      startAt: new Date('2026-01-01'),
      endAt: new Date('2026-12-31'),
      percentage: 10,
      currency: 'VND',
      stackMode: 'STACKABLE',
      priority: 10,
      reducesTaxBase: true,
    };

    const platformShipVoucher: PromotionRule = {
      id: 'platform-ship',
      code: 'FREESHIP',
      name: 'Free Ship 30k',
      kind: 'SHIPPING_OFF',
      target: 'SHIPPING',
      ownerType: 'PLATFORM',
      sponsor: 'PLATFORM',
      requiresCode: true,
      startAt: new Date('2026-01-01'),
      endAt: new Date('2026-12-31'),
      fixedAmount: 30000,
      currency: 'VND',
      stackMode: 'STACKABLE',
      priority: 20,
      reducesTaxBase: false,
    };

    const input: CartInput = {
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          shopId: 'shop-A',
          title: 'Product A',
          originalUnitPrice: 200000,
          quantity: 1,
          taxRate: 0.1,
        },
      ],
      shipping: [{ shopId: 'shop-A', originalFee: 30000 }],
      appliedCodes: ['SHOP10', 'FREESHIP'],
      availablePromotions: [shopVoucher, platformShipVoucher],
      currency: 'VND',
    };

    const result = priceCart(input);

    expect(result.appliedPromotions).toHaveLength(2);
    expect(result.summary.itemsTotalGross).toBe(180000);
    expect(result.summary.shippingFeeDiscount).toBe(30000);
    expect(result.summary.shippingFeeFinal).toBe(0);
    expect(result.summary.grandTotal).toBe(180000);
    expect(result.summary.discountTotal).toBe(50000);
  });

  it('rejects promotion when code is required but not provided or subtotal not met', () => {
    const promo: PromotionRule = {
      id: 'min-500k',
      code: 'BIG50',
      name: '50k off for 500k',
      kind: 'FIXED_OFF',
      target: 'CART',
      ownerType: 'PLATFORM',
      sponsor: 'PLATFORM',
      requiresCode: true,
      minSubtotal: 500000,
      fixedAmount: 50000,
      startAt: new Date('2026-01-01'),
      endAt: new Date('2026-12-31'),
      currency: 'VND',
      stackMode: 'STACKABLE',
      priority: 10,
      reducesTaxBase: false,
    };

    const input: CartInput = {
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          shopId: 'shop-A',
          title: 'Product A',
          originalUnitPrice: 200000,
          quantity: 1,
          taxRate: 0.1,
        },
      ],
      shipping: [{ shopId: 'shop-A', originalFee: 30000 }],
      appliedCodes: ['BIG50'],
      availablePromotions: [promo],
      currency: 'VND',
    };

    const result = priceCart(input);

    expect(result.appliedPromotions).toHaveLength(0);
    expect(result.rejectedPromotions).toHaveLength(1);
    expect(result.rejectedPromotions[0].code).toBe('BIG50');
    expect(result.rejectedPromotions[0].reason).toContain('Chưa đạt giá trị đơn tối thiểu');
  });

  it('handles flash sale price override and gifts correctly', () => {
    const flashSale: PromotionRule = {
      id: 'flash-sale',
      name: 'Flash Sale 99k',
      kind: 'PRICE_OVERRIDE',
      target: 'ITEM',
      ownerType: 'SHOP',
      shopId: 'shop-A',
      sponsor: 'SHOP',
      requiresCode: false,
      overridePrice: 99000,
      startAt: new Date('2026-01-01'),
      endAt: new Date('2026-12-31'),
      currency: 'VND',
      stackMode: 'STACKABLE',
      priority: 1,
      reducesTaxBase: true,
    };

    const giftPromo: PromotionRule = {
      id: 'gift-promo',
      name: 'Buy and get Gift',
      kind: 'GIFT',
      target: 'SHOP_ORDER',
      ownerType: 'SHOP',
      shopId: 'shop-A',
      sponsor: 'SHOP',
      requiresCode: false,
      gifts: [{ giftVariantId: 'gift-var-1', giftQty: 1 }],
      startAt: new Date('2026-01-01'),
      endAt: new Date('2026-12-31'),
      currency: 'VND',
      stackMode: 'STACKABLE',
      priority: 50,
      reducesTaxBase: true,
    };

    const input: CartInput = {
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          shopId: 'shop-A',
          title: 'Shirt',
          originalUnitPrice: 200000,
          quantity: 2,
          taxRate: 0.1,
        },
      ],
      shipping: [{ shopId: 'shop-A', originalFee: 30000 }],
      appliedCodes: [],
      availablePromotions: [flashSale, giftPromo],
      currency: 'VND',
    };

    const result = priceCart(input);

    expect(result.items[0].effectiveUnitPrice).toBe(99000);
    expect(result.items[0].grossTotal).toBe(198000);
    expect(result.giftsToAdd).toHaveLength(1);
    expect(result.giftsToAdd[0].variantId).toBe('gift-var-1');
  });
});
