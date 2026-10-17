import { TaxGroupBreakdown } from './types';

export function computeTaxFromGross(
  gross: number,
  taxRate: number,
  isZeroDecimal = true
): { net: number; tax: number } {
  if (taxRate <= 0) {
    return { net: gross, tax: 0 };
  }

  const net = gross / (1 + taxRate);
  const tax = gross - net;

  if (isZeroDecimal) {
    const roundedNet = Math.round(net);
    const roundedTax = gross - roundedNet;
    return { net: roundedNet, tax: roundedTax };
  }

  const roundedNet = Math.round(net * 100) / 100;
  const roundedTax = Math.round((gross - roundedNet) * 100) / 100;
  return { net: roundedNet, tax: roundedTax };
}

export function buildTaxBreakdown(
  lines: { grossTotal: number; netTotal: number; taxAmount: number; taxRate: number }[]
): TaxGroupBreakdown[] {
  const map = new Map<number, { taxBaseGross: number; netAmount: number; taxAmount: number }>();

  for (const line of lines) {
    const rate = line.taxRate;
    const existing = map.get(rate) || { taxBaseGross: 0, netAmount: 0, taxAmount: 0 };
    existing.taxBaseGross += line.grossTotal;
    existing.netAmount += line.netTotal;
    existing.taxAmount += line.taxAmount;
    map.set(rate, existing);
  }

  const result: TaxGroupBreakdown[] = [];
  for (const [taxRate, val] of map.entries()) {
    result.push({
      taxRate,
      taxBaseGross: Math.round(val.taxBaseGross * 100) / 100,
      netAmount: Math.round(val.netAmount * 100) / 100,
      taxAmount: Math.round(val.taxAmount * 100) / 100,
    });
  }

  return result.sort((a, b) => a.taxRate - b.taxRate);
}
