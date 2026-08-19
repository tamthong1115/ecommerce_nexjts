'use client';

import { Suspense, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Prisma } from '@/lib/generated/prisma';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

// UI
import { Loading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Icons
import { FaCheckCircle } from 'react-icons/fa';
import { HiMiniCheckBadge } from 'react-icons/hi2';
import { PiTruckLight } from 'react-icons/pi';
import { GitCompare } from 'lucide-react';

// Features
import { authClient } from '@/lib/auth-client';
import { formatPrice } from '@/lib/utils';
import { RatingStars } from '@/features/public/components/rating-starts';
import { ReviewsServer } from '@/features/review/components/reviews-server';
import { VoucherSelector } from '@/features/voucher/components/voucher-selector';
import { VoucherDTO } from '@/features/voucher/types/voucher.dto';
import { productRecommendDto } from '@/features/recommend_system/recommend.dto';
import { BoughtTogetherSection } from '@/components/custom/recommendation-section';
import { TopDealItems } from '@/features/public/home/components/top-deal-items';
import { SuggestDealToday } from '@/features/public/product/components/suggest-deal-today';
import SlideImg from '@/features/public/product/components/slide-img';
import Desc from '@/features/public/product/components/desc';

// Sub-components mới tách
import { PriceSection } from '@/app/(public)/products/_components/price-section';
import { VariantSelector } from '@/app/(public)/products/_components/variant-selection-section';
import { ShopCard } from '@/app/(public)/products/_components/shop-card-section';
import { QuantityControl } from '@/app/(public)/products/_components/quantity-control-section';
import { ProductAlsoLikeSection } from '@/app/(public)/products/_components/product-also-like-section';
import { ProductActionButtons } from '@/app/(public)/products/_components/product-action-button';

// Hooks mới tách
import { useProductData } from '@/hooks/use-product-data';
import { usePriceWithVouchers } from '@/hooks/use-price-with-vouchers';
import { useProductActions } from '@/hooks/use-product-action';
import { UpSellingModal } from '@/app/(public)/products/_components/up-selling-modal';

// ─── Types ────────────────────────────────────────────────────────────────────

type SelectedVariant = {
  id: string;
  name: string;
  price: string;
  amount: number;
  image: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

const DetailPage = ({
  RecommendProduct,
}: {
  RecommendProduct: productRecommendDto[];
}) => {
  const params = useParams();
  const pathname = usePathname();
  const c = useTranslations('general');
  const t = useTranslations('product_detail');

  const productId = params?.id as string;

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useProductData(productId);

  // ── Local state ───────────────────────────────────────────────────────────
  const [selVariant, setSelVariant] = useState<SelectedVariant | null>(null);
  const [selectedVouchers, setSelectedVouchers] = useState<VoucherDTO[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);

  // Khởi tạo variant mặc định sau khi data load
  if (data && !selVariant && data.variants.length > 0) {
    const first = data.variants[0];
    setSelVariant({
      id: first.id,
      name: first.name,
      price: first.price,
      amount: 1,
      image: first.image,
    });
  }

  // Kiểm tra auth một lần
  if (!isLoggedIn) {
    authClient.getSession().then((s) => setIsLoggedIn(!!s.data));
  }

  // ── Business logic ────────────────────────────────────────────────────────
  const basePrice = selVariant ? Number(selVariant.price) : 0;
  const priceDetails = usePriceWithVouchers(basePrice, selectedVouchers);

  const { addToCart, buyNow } = useProductActions({
    pathname,
    onAddToCartSuccess: () => setUpsellOpen(true),
  });

  // ── Guards ────────────────────────────────────────────────────────────────
  if (isLoading || !data) {
    return (
      <div className="w-full h-screen max-h-2/3 flex justify-center items-center">
        <Loading size={100} color="var(--primary)" />
      </div>
    );
  }

  if (!selVariant) return <Loading />;

  const fmt = (n: number) =>
    formatPrice(n, { currency: c('t_currency'), rate: Number(c('t_rate')) });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-[75%] flex flex-col justify-center items-start gap-2 mt-5">
      <div className="w-full flex flex-row justify-center items-start gap-2">
        {/* ── LEFT: Product content ── */}
        <section className="w-[70%] flex flex-col justify-start items-start gap-2">
          <div className="w-full flex flex-row gap-2">
            {/* Images */}
            <div className="w-[40%] h-fit bg-background-secondary rounded-lg flex flex-col p-2 sticky top-3">
              <div className="w-full p-2">
                <SlideImg data={data.images} />
              </div>
              <Separator />
              <div className="flex flex-col justify-start items-start p-2 gap-1 text-sm text-muted-foreground">
                <div className="flex flex-row justify-start items-center gap-2">
                  <FaCheckCircle className="text-primary" size={15} />
                  <span>100% Chính hãng</span>
                </div>
                <div className="flex flex-row justify-start items-center gap-2">
                  <FaCheckCircle className="text-primary" size={15} />
                  <span>Hoàn tiền 111% nếu hàng giả</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="w-[60%] flex flex-col gap-4">
              <div className="relative bg-background-secondary rounded-lg p-3 flex flex-col gap-3">
                <Badge variant="secondary">
                  <div className="flex flex-row items-center">
                    <HiMiniCheckBadge className="mr-1" /> Official
                  </div>
                </Badge>

                <h1 className="text-xl font-medium text-text">{data.title}</h1>

                {/* Ratings */}
                <div className="flex flex-row justify-start items-center gap-2 text-text text-sm">
                  <span className="font-bold border-b border-primary text-primary">
                    {data.ratingAvg}
                  </span>
                  <RatingStars value={data.ratingAvg} />
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-muted-foreground">
                    ({data.ratingCount} đánh giá)
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>
                    {t('t_sold')} {data.soldCount}
                  </span>
                </div>

                {/* Price */}
                <PriceSection {...priceDetails} vouchers={selectedVouchers} />

                {/* Variants */}
                <VariantSelector
                  variants={data.variants}
                  selectedId={selVariant.id}
                  onSelect={(v) =>
                    setSelVariant({
                      id: v.id,
                      name: v.name,
                      price: v.price,
                      amount: 1,
                      image: v.image,
                    })
                  }
                />
              </div>

              {/* Shipping */}
              <div className="bg-background-secondary p-3 rounded-lg flex flex-col gap-2">
                <p className="font-semibold text-base">
                  {t('t_delivery_info')}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <PiTruckLight className="text-success" size={20} />
                  <span>
                    Giao đến{' '}
                    <span className="font-medium underline decoration-dashed">
                      Bạn chưa nhập địa chỉ
                    </span>
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className="text-success border-success/20 bg-success/50"
                  >
                    FREESHIP
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    cho đơn hàng từ 150k
                  </span>
                </div>
              </div>

              {/* Voucher */}
              {data.shop && (
                <div className="bg-background-secondary rounded-lg">
                  <VoucherSelector
                    shopId={data.shop.id}
                    productId={data.id}
                    currentPrice={basePrice}
                    selectedVouchers={selectedVouchers}
                    onApply={setSelectedVouchers}
                  />
                </div>
              )}

              {/* Related products */}
              <TopDealItems
                data={RecommendProduct}
                title="Sản phẩm liên quan"
                icon={<GitCompare size={20} />}
                size="3"
                color="text-primary/80"
                limitItem={12}
                showDesc={false}
                showRating={true}
                showFooter={false}
              />

              <Desc data={data.description} />
            </div>
          </div>

          {/* Reviews */}
          <Suspense fallback={<Loading size={40} />}>
            <ReviewsServer
              key={data.id}
              id={data.id}
              ratingAvg={data.ratingAvg}
              ratingCount={data.ratingCount}
            />
          </Suspense>
        </section>

        {/* ── RIGHT: Action panel ── */}
        <section className="w-[30%] sticky top-3 h-fit ml-3">
          <div className="w-full bg-background-secondary rounded-lg p-4 flex flex-col gap-4 shadow-sm border border-border">
            {data.shop && <ShopCard shop={data.shop} />}

            {/* Selected variant preview */}
            <div className="p-2.5 rounded-md bg-muted/40 text-center font-medium text-sm border border-dashed flex flex-col items-center gap-1">
              {selVariant.name}
              <Image
                className="rounded"
                src={selVariant.image}
                width={100}
                height={100}
                alt="product-image"
              />
            </div>

            <QuantityControl
              amount={selVariant.amount}
              onIncrease={() =>
                setSelVariant((prev) =>
                  prev ? { ...prev, amount: prev.amount + 1 } : prev
                )
              }
              onDecrease={() =>
                setSelVariant((prev) =>
                  prev && prev.amount > 1
                    ? { ...prev, amount: prev.amount - 1 }
                    : prev
                )
              }
            />

            {/* Total price */}
            <div className="flex justify-between items-end">
              <p className="font-bold text-sm">{t('t_total')}</p>
              <div className="flex flex-col items-end">
                <p className="text-xl font-bold text-primary">
                  {fmt(priceDetails.final * selVariant.amount)}
                </p>
                {priceDetails.discountAmount > 0 && (
                  <span className="text-xs text-success font-medium">
                    Saved:{' '}
                    {fmt(priceDetails.discountAmount * selVariant.amount)}
                  </span>
                )}
              </div>
            </div>

            <ProductActionButtons
              onBuyNow={() =>
                buyNow(
                  {
                    productId: data.id,
                    variantId: selVariant.id,
                    quantity: selVariant.amount,
                  },
                  selectedVouchers.map((v) => ({ code: v.code }))
                )
              }
              onAddToCart={() =>
                addToCart({
                  variantId: selVariant.id,
                  quantity: selVariant.amount,
                  priceSnap: new Prisma.Decimal(selVariant.price),
                  currency: 'VND',
                })
              }
              isLoggedIn={isLoggedIn}
              shopId={data.shop?.id}
              productId={data.id}
            />
          </div>

          <BoughtTogetherSection
            productId={data.id}
            maxItems={5}
            className="mt-8"
          />
        </section>
      </div>

      {/* ── Full-width sections ── */}
      <ProductAlsoLikeSection productId={data.id} />

      <div className="w-full mt-10">
        <SuggestDealToday />
      </div>
      <UpSellingModal
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
        triggerProductId={data.id}
      />
    </div>
  );
};

export default DetailPage;
