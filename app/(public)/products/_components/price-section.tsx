'use client';

import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { VoucherDTO } from '@/features/voucher/types/voucher.dto';
import { TicketPercent } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PriceSectionProps {
  original: number;
  final: number;
  discountAmount: number;
  percentageDrop: number;
  vouchers: VoucherDTO[];
}

export function PriceSection({
  original,
  final,
  discountAmount,
  percentageDrop,
  vouchers,
}: PriceSectionProps) {
  const c = useTranslations('general');
  const fmt = (n: number) =>
    formatPrice(n, { currency: c('t_currency'), rate: Number(c('t_rate')) });

  if (discountAmount <= 0) {
    return <p className="text-3xl font-bold text-error">{fmt(original)}</p>;
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-linear-to-r from-destructive/10 to-transparent rounded-xl border border-destructive">
      <div className="flex items-end gap-3">
        <p className="text-3xl font-bold text-destructive leading-none">
          {fmt(final)}
        </p>
        <div className="flex flex-col mb-0.5">
          <span className="text-sm text-muted-foreground line-through decoration-destructive/50">
            {fmt(original)}
          </span>
        </div>
        <Badge className="mb-1 bg-destructive/70 hover:bg-destructive">
          -{percentageDrop}%
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {vouchers.map((v) => (
          <Badge
            key={v.code}
            variant="outline"
            className="text-xs font-medium text-destructive border-destructive bg-foreground flex items-center gap-1"
          >
            <TicketPercent size={12} /> {v.code}
          </Badge>
        ))}
      </div>
    </div>
  );
}
