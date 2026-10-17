import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { productItemType } from '@/types/public.data-types';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

interface ProductItemProps {
  item: productItemType;
  renderSaleValue?: boolean;
}

export const ProductItemSm = ({
  item,
  renderSaleValue = true,
}: ProductItemProps) => {
  const t = useTranslations('general');

  const renderSaleInfo = ({
    voucher,
  }: {
    voucher: { type: string; value: number; maxDiscount: number } | null;
  }) => {
    if (!voucher && !renderSaleValue) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatPrice(item.minPrice, {
              currency: t('t_currency'),
              rate: Number(t('t_rate')),
            })}
          </span>
        </div>
      );
    } else if (voucher) {
      const calculatedPrice =
        voucher.type === 'PERCENT'
          ? item.minPrice - (item.minPrice * Number(voucher.value)) / 100
          : item.minPrice - Number(voucher.value);

      const discountedPrice = Math.max(0, calculatedPrice);

      const promotionBadge =
        voucher.type === 'PERCENT' ? (
          <span className="bg-success/10 text-success text-xs font-medium px-2 py-0.5 rounded-md">
            -{voucher.value}%
          </span>
        ) : (
          <span className="bg-success/10 text-success text-xs font-medium px-2 py-0.5 rounded-md">
            -
            {formatPrice(Number(voucher.value), {
              currency: t('t_currency'),
              rate: Number(t('t_rate')),
            })}
          </span>
        );

      return (
        <div className="w-full flex flex-col justify-center items-end gap-1">
          <div className="flex flex-row justify-end items-center gap-2">
            <div className="text-error font-medium text-sm">
              {formatPrice(discountedPrice, {
                currency: t('t_currency'),
                rate: Number(t('t_rate')),
              })}
            </div>
          </div>
          {promotionBadge}
        </div>
      );
    }
    return null;
  };

  return (
    <Link
      key={item.id}
      href={`/products/${item.id}`}
      className="flex flex-col justify-start items-start flex-1 border border-border border-2 rounded-lg hover:cursor-pointer"
    >
      <div className="relative w-full shrink-0 aspect-square overflow-hidden rounded-t-lg">
        <Image
          src={item.imageUrl}
          alt={item.title || 'thumbnail'}
          sizes="auto"
          fill
          className="object-cover"
        />
      </div>
      <Card className="w-full gap-2 p-0 max-w-sm shadow-none border-none rounded-t-none shrink-0">
        <CardHeader className="p-2">
          <CardTitle className="overflow-hidden">
            <p className="text-base font-normal line-clamp-1">{item.title}</p>
          </CardTitle>
          {item.description ? (
            <CardDescription>
              <div className="w-full">
                <p className="line-clamp-2 text-sm mb-1">{item.description}</p>
              </div>
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col justify-start items-start px-2 py-1">
          {renderSaleInfo({ voucher: item.voucher })}
        </CardContent>
      </Card>
    </Link>
  );
};
