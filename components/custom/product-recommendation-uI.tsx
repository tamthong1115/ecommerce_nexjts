import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { productRecommendDto } from '@/features/recommend_system/recommend.dto';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from '@/features/public/components/rating-starts';

interface ProductItemProps {
  item: productRecommendDto;
  showDesc?: boolean;
  showRating?: boolean;
  showFooter?: boolean;
  badgeText?: string;
  isNew?: boolean;
  soldCount?: number;
}

export const ProductRecommendationItem = ({
  item,
  showDesc,
  showRating = true,
  showFooter = true,
  badgeText,
  isNew = false,
  soldCount,
}: ProductItemProps) => {
  const t = useTranslations('general');

  const renderSaleInfo = ({
    voucher,
  }: {
    voucher: { type: string; value: number; maxDiscount: number } | null;
  }) => {
    const originalPrice = (
      <span className="text-muted-foreground line-through text-xs font-normal ml-2">
        {formatPrice(item.minPrice, {
          currency: t('t_currency'),
          rate: Number(t('t_rate')),
        })}
      </span>
    );

    if (!voucher) {
      return (
        <div className="flex items-center mt-2">
          <p className="font-semibold text-lg">
            {formatPrice(item.minPrice, {
              currency: t('t_currency'),
              rate: Number(t('t_rate')),
            })}
          </p>
        </div>
      );
    }

    const discountAmount =
      voucher.type === 'PERCENT'
        ? (item.minPrice * Number(voucher.value)) / 100
        : Number(voucher.value);

    const finalDiscountAmount = voucher.maxDiscount
      ? Math.min(discountAmount, voucher.maxDiscount)
      : discountAmount;

    const discountedPrice = Math.max(0, item.minPrice - finalDiscountAmount);

    return (
      <div className="flex flex-col items-start w-full mt-2">
        <div className="flex items-baseline flex-wrap">
          <span className="text-error font-bold text-lg">
            {formatPrice(discountedPrice, {
              currency: t('t_currency'),
              rate: Number(t('t_rate')),
            })}
          </span>
          {originalPrice}
        </div>
      </div>
    );
  };

  const getDiscountPercent = () => {
    if (!item.voucher) return null;
    if (item.voucher.type === 'PERCENT') return item.voucher.value;

    const percent = Math.round((item.voucher.value / item.minPrice) * 100);
    return Math.min(100, percent);
  };

  const discountPercent = getDiscountPercent();

  return (
    <Link
      href={`/products/${item.id}`}
      className="group w-full h-full flex flex-col focus:outline-none focus:ring-2 focus:ring-accent-hover rounded-xl"
    >
      <Card className="w-full h-full shadow-sm hover:shadow-lg transition-all duration-300 border border-border flex flex-col overflow-hidden rounded-xl p-0 bg-background hover:border-1 hover:border-error">
        <CardHeader className="p-0 relative">
          <div className="relative w-full aspect-square overflow-hidden bg-background-secondary/20">
            <Image
              src={item.imageUrl}
              alt={item.title || 'Product image'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
              {badgeText && (
                <Badge
                  variant="secondary"
                  className="bg-info/90 text-white border-none text-[10px] px-1.5 py-0.5"
                >
                  {badgeText}
                </Badge>
              )}
              {isNew && (
                <Badge className="bg-success text-white border-none text-[10px] px-1.5 py-0.5">
                  Mới
                </Badge>
              )}
            </div>

            {discountPercent && discountPercent > 0 && (
              <div className="absolute top-2 right-2 bg-error/20 backdrop-blur-sm text-error text-xs font-bold px-2 py-1 rounded-md border border-error/40">
                -{discountPercent}%
              </div>
            )}
          </div>

          <CardTitle className="px-3 py-1 mt-1">
            <div className="flex items-start gap-1.5 min-h-[2.5rem]">
              <h3 className="text-sm font-medium line-clamp-2 transition-colors group-hover:text-primary">
                {item.title}
              </h3>
            </div>
          </CardTitle>

          {showDesc && item.description && (
            <CardDescription className="px-3">
              <p className="line-clamp-2 text-xs text-text-secondary">
                {item.description}
              </p>
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex flex-col justify-end flex-grow px-3 pb-3">
          {renderSaleInfo({ voucher: item.voucher })}

          <div className="flex flex-row justify-between items-center mt-2 w-full gap-2">
            {showRating && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <RatingStars value={Number(item.ratingAvg || 0)} size={14} />
                <span>({item.ratingCount || 0})</span>
              </div>
            )}

            {soldCount !== undefined && (
              <span className="text-[11px] text-text-secondary">
                Đã bán{' '}
                {soldCount > 1000
                  ? `${(soldCount / 1000).toFixed(1)}k`
                  : soldCount}
              </span>
            )}
          </div>
        </CardContent>

        {showFooter && (
          <>
            <Separator className="opacity-50" />
            <CardFooter className="px-3 py-2 bg-background-secondary/10">
              <p className="w-full text-text-secondary text-[11px] truncate text-right">
                Xuất xứ:{' '}
                <span className="font-medium text-text">
                  {item.origin || 'Đang cập nhật'}
                </span>
              </p>
            </CardFooter>
          </>
        )}
      </Card>
    </Link>
  );
};
