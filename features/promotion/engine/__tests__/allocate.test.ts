// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { allocateLargestRemainder } from '../allocate';

describe('allocateLargestRemainder', () => {
  it('allocates discount proportionally with exact integer sum for VND', () => {
    const totalDiscount = 100000;
    const weights = [
      { id: 'item-1', weight: 200000 },
      { id: 'item-2', weight: 300000 },
      { id: 'item-3', weight: 500000 },
    ];

    const result = allocateLargestRemainder(totalDiscount, weights, true);

    expect(result['item-1']).toBe(20000);
    expect(result['item-2']).toBe(30000);
    expect(result['item-3']).toBe(50000);

    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBe(totalDiscount);
  });

  it('resolves fractional remainders without losing or adding a single dong', () => {
    const totalDiscount = 10000;
    const weights = [
      { id: 'item-1', weight: 30000 },
      { id: 'item-2', weight: 30000 },
      { id: 'item-3', weight: 30000 },
    ];

    const result = allocateLargestRemainder(totalDiscount, weights, true);

    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBe(totalDiscount);
    expect(result['item-1'] + result['item-2'] + result['item-3']).toBe(10000);
  });

  it('supports USD with 2 decimal precision', () => {
    const totalDiscount = 10;
    const weights = [
      { id: 'item-1', weight: 30 },
      { id: 'item-2', weight: 30 },
      { id: 'item-3', weight: 30 },
    ];

    const result = allocateLargestRemainder(totalDiscount, weights, false);

    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(Math.round(sum * 100) / 100).toBe(10);
  });

  it('handles edge case when total weight is zero or discount is zero', () => {
    const result = allocateLargestRemainder(0, [{ id: '1', weight: 100 }], true);
    expect(result['1']).toBe(0);

    const zeroWeightResult = allocateLargestRemainder(5000, [{ id: '1', weight: 0 }], true);
    expect(zeroWeightResult['1']).toBe(0);
  });
});
