'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ProductRecommendationItem } from '@/components/custom/product-recommendation-uI';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecommendations } from '@/hooks/use-recommendation';

interface ProductAlsoLikeSectionProps {
  productId: string;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function AlsoLikeSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="shrink-0 w-44 flex flex-col gap-2">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ProductAlsoLikeSection({
  productId,
}: ProductAlsoLikeSectionProps) {
  // Lazy load: chỉ fetch khi section enter viewport
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { rootMargin: '200px' } // pre-fetch khi còn cách 200px
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { data: products, isLoading } = useRecommendations(
    'also-like',
    isVisible ? productId : undefined // chỉ fetch khi visible
  );

  // Track scroll state để hiện/ẩn navigation arrows
  const trackScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', trackScroll, { passive: true });
    trackScroll();
    return () => el.removeEventListener('scroll', trackScroll);
  }, [products, trackScroll]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
  };

  const displayProducts = products?.slice(0, 12) ?? [];

  // Không render nếu fetch xong mà không có data
  if (!isLoading && isVisible && displayProducts.length === 0) return null;

  return (
    <section
      ref={rootRef}
      className="w-full py-8 border-t border-border/60 bg-background-secondary p-4 rounded-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-violet-500/10 rounded-lg">
            <Sparkles size={18} className="text-violet-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Có thể bạn cũng thích
            </h2>
            <p className="text-xs text-muted-foreground">
              Dựa trên sở thích của những người mua tương tự bạn
            </p>
          </div>
        </div>

        {/* Desktop scroll arrows */}
        {!isLoading && displayProducts.length > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full transition-opacity',
                !canScrollLeft && 'opacity-30 cursor-not-allowed'
              )}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full transition-opacity',
                !canScrollRight && 'opacity-30 cursor-not-allowed'
              )}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading || !isVisible ? (
        <AlsoLikeSkeleton />
      ) : (
        <div
          ref={scrollRef}
          className={cn(
            // Desktop: horizontal scroll, ẩn scrollbar
            'flex gap-4 overflow-x-auto pb-2',
            'scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]',
            // Mobile: wrap thành grid 2 cột
            'sm:flex-nowrap flex-wrap'
          )}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayProducts.map((item) => (
            <div
              key={item.id}
              className={cn(
                'shrink-0 scroll-snap-align-start',
                // Desktop: fixed width item
                'sm:w-[17%]',
                // Mobile: 2 columns
                'w-[calc(50%-8px)]'
              )}
              style={{ scrollSnapAlign: 'start' }}
            >
              <ProductRecommendationItem
                item={item}
                showRating
                showFooter={false}
                soldCount={item.soldCount}
                showDesc={true}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
