// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { computeTaxFromGross, buildTaxBreakdown } from '../tax';

describe('tax calculations', () => {
  it('correctly splits gross inclusive price into net and tax for 10% VAT in VND', () => {
    const gross = 110000;
    const taxRate = 0.1;

    const { net, tax } = computeTaxFromGross(gross, taxRate, true);

    expect(net).toBe(100000);
    expect(tax).toBe(10000);
    expect(net + tax).toBe(gross);
  });

  it('correctly handles rounding for odd amounts in VND', () => {
    const gross = 100000;
    const taxRate = 0.1;

    const { net, tax } = computeTaxFromGross(gross, taxRate, true);

    expect(net).toBe(90909);
    expect(tax).toBe(9091);
    expect(net + tax).toBe(gross);
  });

  it('correctly aggregates tax breakdown across multiple rates', () => {
    const lines = [
      { grossTotal: 110000, netTotal: 100000, taxAmount: 10000, taxRate: 0.1 },
      { grossTotal: 108000, netTotal: 100000, taxAmount: 8000, taxRate: 0.08 },
      { grossTotal: 55000, netTotal: 50000, taxAmount: 5000, taxRate: 0.1 },
    ];

    const breakdown = buildTaxBreakdown(lines);

    expect(breakdown).toHaveLength(2);

    const rate8 = breakdown.find((b) => b.taxRate === 0.08);
    expect(rate8).toBeDefined();
    expect(rate8?.taxBaseGross).toBe(108000);
    expect(rate8?.taxAmount).toBe(8000);

    const rate10 = breakdown.find((b) => b.taxRate === 0.1);
    expect(rate10).toBeDefined();
    expect(rate10?.taxBaseGross).toBe(165000);
    expect(rate10?.taxAmount).toBe(15000);
  });
});
