// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { arePromotionsCompatible, selectOptimalPromotionSet } from '../stacking';
import { PromotionRule } from '../types';

function createMockPromo(overrides: Partial<PromotionRule>): PromotionRule {
  return {
    id: 'p-1',
    name: 'Promo 1',
    kind: 'PERCENT_OFF',
    target: 'CART',
    ownerType: 'PLATFORM',
    sponsor: 'PLATFORM',
    requiresCode: false,
    startAt: new Date('2026-01-01'),
    endAt: new Date('2026-12-31'),
    currency: 'VND',
    stackMode: 'STACKABLE',
    priority: 100,
    reducesTaxBase: true,
    ...overrides,
  };
}

describe('arePromotionsCompatible', () => {
  it('returns false if any promo is EXCLUSIVE', () => {
    const a = createMockPromo({ id: 'a', stackMode: 'EXCLUSIVE' });
    const b = createMockPromo({ id: 'b', stackMode: 'STACKABLE' });

    expect(arePromotionsCompatible(a, b)).toBe(false);
  });

  it('returns false if promotions share the same stackGroupId', () => {
    const a = createMockPromo({ id: 'a', stackGroupId: 'group-order-discount' });
    const b = createMockPromo({ id: 'b', stackGroupId: 'group-order-discount' });

    expect(arePromotionsCompatible(a, b)).toBe(false);
  });

  it('returns false if promotion is in incompatible list', () => {
    const a = createMockPromo({ id: 'a', incompatiblePromotionIds: ['b'] });
    const b = createMockPromo({ id: 'b' });

    expect(arePromotionsCompatible(a, b)).toBe(false);
  });

  it('returns true if promotions are stackable and have no conflicts', () => {
    const a = createMockPromo({ id: 'a', stackGroupId: 'group-cart' });
    const b = createMockPromo({ id: 'b', stackGroupId: 'group-shipping', kind: 'SHIPPING_OFF' });

    expect(arePromotionsCompatible(a, b)).toBe(true);
  });
});

describe('selectOptimalPromotionSet', () => {
  it('chooses the combination that yields the maximum total discount', () => {
    const p1 = createMockPromo({ id: 'p1', stackGroupId: 'g1' });
    const p2 = createMockPromo({ id: 'p2', stackGroupId: 'g1' });
    const ship = createMockPromo({ id: 'ship', stackGroupId: 'g2', kind: 'SHIPPING_OFF' });

    const candidates = [
      { promo: p1, benefit: 50000 },
      { promo: p2, benefit: 80000 },
      { promo: ship, benefit: 30000 },
    ];

    const optimal = selectOptimalPromotionSet(candidates);

    expect(optimal).toHaveLength(2);
    expect(optimal.some((p) => p.id === 'p2')).toBe(true);
    expect(optimal.some((p) => p.id === 'ship')).toBe(true);
  });
});
