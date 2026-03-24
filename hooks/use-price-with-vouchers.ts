import { useMemo } from 'react';
import { VoucherDTO } from '@/features/voucher/types/voucher.dto';

interface PriceDetails {
  original: number;
  final: number;
  discountAmount: number;
  percentageDrop: number;
}

export function usePriceWithVouchers(
  basePrice: number,
  vouchers: VoucherDTO[]
): PriceDetails {
  return useMemo(() => {
    if (!basePrice)
      return { original: 0, final: 0, discountAmount: 0, percentageDrop: 0 };

    const original = basePrice;
    let final = original;
    let totalDiscount = 0;

    const shopVouchers = vouchers.filter((v) => !!v.shopId);
    const platformVouchers = vouchers.filter((v) => !v.shopId);

    const applyVoucher = (price: number, v: VoucherDTO) => {
      let discount = v.type === 'FIXED' ? v.value : (price * v.value) / 100;
      if (v.maxDiscount && discount > v.maxDiscount) discount = v.maxDiscount;
      return discount;
    };

    shopVouchers.forEach((v) => {
      const d = applyVoucher(original, v);
      final -= d;
      totalDiscount += d;
    });

    final = Math.max(0, final);

    platformVouchers.forEach((v) => {
      const d = applyVoucher(final, v);
      final -= d;
      totalDiscount += d;
    });

    final = Math.max(0, final);
    const percentageDrop =
      original > 0 ? Math.round((totalDiscount / original) * 100) : 0;

    return { original, final, discountAmount: totalDiscount, percentageDrop };
  }, [basePrice, vouchers]);
}
