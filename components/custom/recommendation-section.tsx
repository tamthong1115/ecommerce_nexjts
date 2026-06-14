// components/custom/recommendation-section.tsx
'use client';

import { ProductRecommendationItem } from '@/components/custom/product-recommendation-uI';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecommendations } from '@/hooks/use-recommendation';

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionVariant = 'bought-together' | 'also-like';

interface RecommendationSectionProps {
  productId: string;
  variant: SectionVariant;
  maxItems?: number;
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VARIANT_CONFIG = {
  'bought-together': {
    title: 'Thường mua cùng nhau',
    subtitle: 'Khách hàng thường mua những sản phẩm này cùng lúc',
    badge: '🛒 Combo',
    icon: ShoppingBag,
    badgeText: 'Hay mua kèm',
    accent: 'from-amber-500/10 via-transparent',
  },
  'also-like': {
    title: 'Có thể bạn cũng thích',
    subtitle: 'Dựa trên hành vi của những người mua tương tự',
    badge: '✨ Gợi ý',
    icon: Sparkles,
    badgeText: 'Gợi ý cho bạn',
    accent: 'from-violet-500/10 via-transparent',
  },
} as const;

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function RecommendationSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─── Core section ─────────────────────────────────────────────────────────────

function RecommendationSection({
  productId,
  variant,
  maxItems = 10,
  className,
}: RecommendationSectionProps) {
  const {
    data: products,
    isLoading,
    isError,
  } = useRecommendations(variant, productId);
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  // Không render gì nếu lỗi hoặc không có data
  if (isError || (!isLoading && (!products || products.length === 0))) {
    return null;
  }

  const displayedProducts = products?.slice(0, maxItems) ?? [];

  return (
    <section className={cn('w-full', className)}>
      {/* Header */}
      <div
        className={cn(
          'flex items-start gap-3 mb-6 pb-4',
          'border-b border-border/60',
          'bg-gradient-to-r to-transparent rounded-t-xl px-1',
          config.accent
        )}
      >
        <div className="p-2 bg-background-secondary rounded-lg shadow-sm mt-0.5">
          <Icon size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {config.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <RecommendationSkeleton />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayedProducts.map((item) => (
            <ProductRecommendationItem
              key={item.id}
              item={item}
              badgeText={config.badgeText}
              showRating
              showFooter={false}
              soldCount={item.soldCount}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Public named exports ─────────────────────────────────────────────────────

export function BoughtTogetherSection({
  productId,
  ...rest
}: Omit<RecommendationSectionProps, 'variant'>) {
  return (
    <RecommendationSection
      productId={productId}
      variant="bought-together"
      {...rest}
    />
  );
}

export function AlsoLikeSection({
  productId,
  ...rest
}: Omit<RecommendationSectionProps, 'variant'>) {
  return (
    <RecommendationSection
      productId={productId}
      variant="also-like"
      {...rest}
    />
  );
}
