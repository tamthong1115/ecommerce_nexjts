'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

interface QuantityControlProps {
  amount: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function QuantityControl({
  amount,
  onIncrease,
  onDecrease,
}: QuantityControlProps) {
  const t = useTranslations('product_detail');

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="font-medium text-sm text-muted-foreground">
          {t('t_quantity')}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onDecrease}
            disabled={amount <= 1}
          >
            <FaMinus size={10} />
          </Button>
          <span className="w-6 text-center font-bold text-sm">{amount}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onIncrease}
          >
            <FaPlus size={10} />
          </Button>
        </div>
      </div>
      <Separator />
    </>
  );
}
