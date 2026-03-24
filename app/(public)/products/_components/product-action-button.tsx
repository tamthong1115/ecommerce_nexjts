'use client';

import { Button } from '@/components/ui/button';
import { ChatButton } from '@/features/shared/components/chat/chat-button';
import { useTranslations } from 'next-intl';

interface ProductActionButtonsProps {
  onBuyNow: () => void;
  onAddToCart: () => void;
  isLoggedIn: boolean;
  shopId?: string;
  productId: string;
}

export function ProductActionButtons({
  onBuyNow,
  onAddToCart,
  isLoggedIn,
  shopId,
  productId,
}: ProductActionButtonsProps) {
  const t = useTranslations('product_detail');

  return (
    <div className="flex flex-col gap-2.5 w-full mt-2">
      <Button
        size="lg"
        className="w-full bg-destructive hover:bg-destructive/80 cursor-pointer font-bold shadow-md shadow-red-200"
        onClick={onBuyNow}
      >
        {t('t_buy_action')}
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="w-full border-primary text-primary hover:bg-primary/5"
        onClick={onAddToCart}
      >
        {t('t_add_action')}
      </Button>

      <Button
        variant="ghost"
        className="w-full text-xs h-9 border text-muted-foreground"
      >
        {t('t_pay_later')}
      </Button>

      {isLoggedIn && shopId && (
        <ChatButton shopId={shopId} product={{ id: productId }} />
      )}
    </div>
  );
}
