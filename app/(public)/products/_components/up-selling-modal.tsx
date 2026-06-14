'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { productRecommendDto } from '@/features/recommend_system/recommend.dto';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Prisma } from '@/lib/generated/prisma';
import { useState } from 'react';
import { useRecommendations } from '@/hooks/use-recommendation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** productId vừa được add vào cart */
  triggerProductId: string;
}

// ─── Mini card trong modal ────────────────────────────────────────────────────

function UpsellCard({
  item,
  onAddToCart,
  isAdding,
}: {
  item: productRecommendDto;
  onAddToCart: (item: productRecommendDto) => void;
  isAdding: boolean;
}) {
  const c = useTranslations('general');

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition-all group">
      {/* Thumbnail */}
      <Link href={`/products/${item.id}`} className="shrink-0">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.id}`}>
          <p className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">
            {item.title}
          </p>
        </Link>
        <p className="text-sm font-bold text-destructive mt-0.5">
          {formatPrice(item.minPrice, {
            currency: c('t_currency'),
            rate: Number(c('t_rate')),
          })}
        </p>
      </div>

      {/* CTA */}
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        onClick={() => onAddToCart(item)}
        disabled={isAdding}
      >
        <ShoppingCart size={14} className="mr-1" />
        Thêm
      </Button>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function UpsellSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function UpSellingModal({
  open,
  onOpenChange,
  triggerProductId,
}: UpsellModalProps) {
  const { data: products, isLoading } = useRecommendations(
    'bought-together',
    triggerProductId
  );

  // Track từng item đang được adding để disable button đúng item
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAddToCart = async (item: productRecommendDto) => {
    setAddingId(item.id);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: item.id, // NOTE: cần variant default — xem note bên dưới
          quantity: 1,
          priceSnap: new Prisma.Decimal(item.minPrice),
          currency: 'VND',
        }),
      });
      if (res.ok) {
        toast.success(`Đã thêm "${item.title}" vào giỏ hàng`);
      } else {
        toast.error('Thêm vào giỏ hàng thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setAddingId(null);
    }
  };

  const displayProducts = products?.slice(0, 5) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-success" />
            Đã thêm vào giỏ hàng
          </DialogTitle>
        </DialogHeader>

        {/* Divider + upsell label */}
        {(isLoading || displayProducts.length > 0) && (
          <div className="flex items-center gap-2 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <ShoppingBag size={12} />
              Thường mua kèm
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )}

        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <UpsellSkeleton />
          ) : (
            <div className="flex flex-col gap-2 pr-3">
              {displayProducts.map((item) => (
                <UpsellCard
                  key={item.id}
                  item={item}
                  onAddToCart={handleAddToCart}
                  isAdding={addingId === item.id}
                />
              ))}
              {displayProducts.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Không có gợi ý nào
                </p>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer actions */}
        <div className="flex gap-2 pt-2 border-t border-border hover:cursor-pointer">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Tiếp tục mua sắm
          </Button>
          <Button
            className="flex-1 hover:cursor-pointer"
            onClick={() => {
              onOpenChange(false);
              window.location.href = '/cart';
            }}
          >
            Xem giỏ hàng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
