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
import { RatingStars } from './rating-starts';
import Link from 'next/link';
import { productItemType } from '@/types/public.data-types';

interface productItemProps {
  item: productItemType;
  showDesc?: boolean;
  showRating?: boolean;
  showFooter?: boolean;
}

export const ProductItem = ({
  item,
  showDesc = false,
  showRating = true,
  showFooter = true,
}: productItemProps) => {
  const t = useTranslations('general');
  const renderSaleInfo = ({
    voucher,
  }: {
    voucher: { type: string; value: number; maxDiscount: number } | null;
  }) => {
    //console.log(voucher);
    const originalPrice = (
      <span className="text-muted-foreground line-through text-xs">
        {formatPrice(item.minPrice, {
          currency: t('t_currency'),
          rate: Number(t('t_rate')),
        })}
      </span>
    );
    //case 1: no voucher applied
    if (!voucher) {
      return (
        <div className="flex items-center gap-2">
          <p className="font-medium">
            {formatPrice(item.minPrice, {
              currency: t('t_currency'),
              rate: Number(t('t_rate')),
            })}
          </p>
        </div>
      );
    } else if (voucher) {
      const calculatedPrice =
        voucher.type === 'PERCENT'
          ? item.minPrice - (item.minPrice * Number(voucher.value)) / 100
          : item.minPrice - Number(voucher.value);

      // Đảm bảo giá không bao giờ âm
      const discountedPrice = Math.max(0, calculatedPrice);

      //show how much percent sale that product have
      const promotionBadge =
        voucher.type === 'PERCENT' ? (
          <span className="bg-success/10 text-success text-xs font-medium px-2 py-0.5 rounded-md">
            -{voucher.value}%
          </span>
        ) : (
          <span className="bg-success/10 text-success text-xs font-medium px-2 py-0.5 rounded-md">
            {voucher.value >= item.minPrice
              ? '-100%'
              : `-${Math.floor(voucher.value / item.minPrice) * 100}%`}
          </span>
        );

      return (
        <div className="flex flex-col items-start gap-2 w-full">
          <div className="text-error font-medium text-lg">
            {formatPrice(discountedPrice, {
              currency: t('t_currency'),
              rate: Number(t('t_rate')),
            })}
          </div>
          {/* show badge and original price */}
          <div className="flex grow">
            {promotionBadge}
            {originalPrice}
          </div>
        </div>
      );
    }
  };

  return (
    <Link
      key={item.id}
      className={`w-full h-full flex flex-1 bg-background border-border border-2 rounded-lg hover:cursor-pointer`}
      href={`/products/${item.id}`}
    >
      <Card className="w-full shadow-none border-none rounded-t-none flex flex-col justify-between gap-2 shrink-0 p-0 rounded-lg">
        <CardHeader className="p-0">
          <Image
            src={item.imageUrl}
            alt="thumbnail"
            width={0}
            height={0}
            sizes="100vw"
            unoptimized
            className="w-full aspect-square object-cover rounded-t-lg"
          />
          <CardTitle className="overflow-hidden px-2 py-1">
            <p className="text-base font-normal line-clamp-2 min-h-12">
              {item.title}
            </p>
          </CardTitle>
          {showDesc ? (
            <CardDescription className="px-2 py-1">
              <div className="w-full">
                <p className="line-clamp-2 text-sm mb-1">
                  {item.description
                    ? item.description
                    : 'Đây là 1 sản phẩm cực tốt tốt ở đâu thì mua đi r biết'}
                </p>
              </div>
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="h-full flex flex-col justify-between items-start px-2 pb-1">
          {renderSaleInfo({ voucher: item.voucher })}
          {showRating ? (
            <div className="flex flex-row justify-start items-center gap-2">
              <RatingStars value={Number(item.ratingAvg)} size={15} />
              <div>
                {'('}
                {item.ratingCount}
                {')'}
              </div>
            </div>
          ) : null}
        </CardContent>
        {showFooter ? (
          <CardFooter className="flex-col flex justify-center items-start px-2 py-1">
            <Separator />
            <p className="w-full p-2 text-muted-foreground text-xs line-clamp-1 whitespace-nowrap overflow-x-hidden overflow-ellipsis text-right">
              Made in {item.origin}
            </p>
          </CardFooter>
        ) : null}
      </Card>
    </Link>
  );
};
