'use client';

import { createOrderDraft } from '@/app/actions/order_draft';
import { Loading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { fetchProductById } from '@/funcs/fetch';
import { authClient } from '@/lib/auth-client';
import { Prisma } from '@/lib/generated/prisma';
import { paths } from '@/lib/path';
import { formatPrice } from '@/lib/utils';
import { AddToCartRequest } from '@/types/cart.data-types';
import { productDetailType } from '@/types/public.data-types';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaMinus, FaPlus } from 'react-icons/fa';
import { HiMiniCheckBadge } from 'react-icons/hi2';
import { PiTruckLight } from 'react-icons/pi';
import { toast } from 'sonner';

import { GitCompare, TicketPercent } from 'lucide-react';

import { ChatButton } from '@/components/chat/chat-button';

import { VoucherSelector } from '@/features/voucher/_components/voucher-selector';
import { VoucherDTO } from '@/features/voucher/voucher.dto';
import Desc from '../../../../features/public/product/components/desc';
import { ReviewsServer } from '@/features/review/components/reviews-server';
import SlideImg from '../../../../features/public/product/components/slide-img';
import { SuggestDealToday } from '@/features/public/product/components/suggest-deal-today';

import { TopDealItems } from '@/features/public/home/components/top-deal-items';
import logo from '@/public/logo.jpg';
import Link from 'next/link';
import Decimal = Prisma.Decimal;
import { RatingStars } from '@/features/public/components/rating-starts';
import { productRecommendDto } from '@/features/recommend_system/recommend.dto';

interface SelectedVariant {
  name: string;
  id: string;
  price: string;
  amount: number;
  image: string;
}

type ItemType = {
  productId: string;
  variantId: string;
  quantity: number;
};

const DetailPage = ({
  RecommendProduct,
}: {
  RecommendProduct: productRecommendDto[];
}) => {
  const route = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const [data, setData] = useState<productDetailType | null>(null);
  const [selVariant, setSelVariant] = useState<SelectedVariant | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedVouchers, setSelectedVouchers] = useState<VoucherDTO[]>([]);

  const t = useTranslations('product_detail');
  const c = useTranslations('general');

  useEffect(() => {
    authClient.getSession().then((session) => {
      setIsLoggedIn(!!session.data);
    });
  }, []);

  useEffect(() => {
    if (typeof params?.id === 'string') {
      const loadData = async () => {
        const res = await fetchProductById(params.id as string);
        if (res) {
          setData(res);
          // Default to first variant
          if (res.variants && res.variants.length > 0) {
            setSelVariant({
              name: res.variants[0].name,
              id: res.variants[0].id,
              price: res.variants[0].price,
              amount: 1,
              image: res.variants[0].image,
            });
          }
        }
        console.log(res + '-' + data);
      };
      loadData();
    }
  }, [params?.id]);

  const currentVariantPrice = useMemo(() => {
    return selVariant ? Number(selVariant.price) : 0;
  }, [selVariant]);

  //  Calculate Final Price with Voucher Stacking
  const priceDetails = useMemo(() => {
    if (!selVariant) return { original: 0, final: 0, discountAmount: 0 };

    const original = currentVariantPrice;
    let final = original;
    let totalDiscount = 0;

    const shopVouchers = selectedVouchers.filter((v) => !!v.shopId);
    const platformVouchers = selectedVouchers.filter((v) => !v.shopId);

    // Apply Shop Voucher
    shopVouchers.forEach((v) => {
      let discount = 0;
      if (v.type === 'FIXED') {
        discount = v.value;
      } else {
        discount = (original * v.value) / 100;
        if (v.maxDiscount && discount > v.maxDiscount) discount = v.maxDiscount;
      }
      final -= discount;
      totalDiscount += discount;
    });

    // Ensure not negative before applying platform
    final = Math.max(0, final);

    // Apply Platform Voucher
    platformVouchers.forEach((v) => {
      let discount = 0;
      if (v.type === 'FIXED') {
        discount = v.value;
      } else {
        // Platform percent usually applies to the intermediate price (after shop discount)
        discount = (final * v.value) / 100;
        if (v.maxDiscount && discount > v.maxDiscount) discount = v.maxDiscount;
      }
      final -= discount;
      totalDiscount += discount;
    });

    return {
      original,
      final: Math.max(0, final),
      discountAmount: totalDiscount,
    };
  }, [currentVariantPrice, selVariant, selectedVouchers]);

  const handleSelectVariant = (
    id: string,
    name: string,
    price: string,
    amount: number = 1,
    image: string
  ) => {
    setSelVariant({ name, id, price, amount, image });
  };

  const handleMinus = () => {
    if (selVariant && selVariant.amount > 1) {
      setSelVariant((prev) =>
        prev ? { ...prev, amount: prev.amount - 1 } : prev
      );
    }
  };

  const handlePlus = () => {
    if (selVariant) {
      setSelVariant((prev) =>
        prev ? { ...prev, amount: prev.amount + 1 } : prev
      );
    }
  };

  const buyNow = async (item: ItemType) => {
    const session = await authClient.getSession();
    if (!session?.data?.user?.emailVerified) {
      const callback = encodeURIComponent(pathname ?? '/');
      route.push(`${paths.login}?callbackUrl=${callback}`);
      return;
    }

    try {
      const orderData = {
        notes: '',
        items: [item],
        voucher: selectedVouchers.map((v) => ({ code: v.code })),
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(orderData));

      const res = await createOrderDraft(formData);

      if (res.success) {
        toast.success('Đang chuyển đến trang thanh toán...');
        route.push('/checkout');
      } else if (!res.success && res?.redirectTo) {
        toast.error(res.message);
        route.push(res.redirectTo);
      } else {
        toast.error('Lỗi: ' + res.error);
      }
    } catch (e) {
      console.error(e);
      toast.error(`Lỗi: ${e}`);
    }
  };

  const addProductToCart = async (params: AddToCartRequest) => {
    const session = await authClient.getSession();
    if (!session?.data?.user?.emailVerified) {
      const callback = encodeURIComponent(pathname ?? '/');
      route.push(`${paths.login}?callbackUrl=${callback}`);
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        toast.success('Thêm vào giỏ hàng thành công');
      } else {
        const errorText = await response
          .json()
          .catch(() => response.statusText);
        const errNotice =
          response.status === 401 ? 'Bạn chưa đăng nhập' : errorText;
        toast.error(`Thêm vào giỏ hàng thất bại: ${errNotice}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error(`Thêm vào giỏ hàng thất bại: ${message}`);
    }
  };

  //  UI Renderers
  const renderPriceSection = () => {
    if (!selVariant) return null;

    const { original, final, discountAmount } = priceDetails;

    if (discountAmount <= 0) {
      return (
        <p className="text-3xl font-bold text-error">
          {formatPrice(original, {
            currency: c('t_currency'),
            rate: Number(c('t_rate')),
          })}
        </p>
      );
    }

    const percentageDrop = Math.round((discountAmount / original) * 100);

    return (
      <div className="flex flex-col gap-2 p-4 bg-linear-to-r from-destructive/10 to-transparent rounded-xl border border-destructive">
        <div className="flex items-end gap-3">
          <p className="text-3xl font-bold text-destructive leading-none">
            {formatPrice(final, {
              currency: c('t_currency'),
              rate: Number(c('t_rate')),
            })}
          </p>
          <div className="flex flex-col mb-0.5">
            <span className="text-sm text-muted-foreground line-through decoration-destructive/50">
              {formatPrice(original, {
                currency: c('t_currency'),
                rate: Number(c('t_rate')),
              })}
            </span>
          </div>
          <Badge className="mb-1 bg-destructive/70 hover:bg-destructive">
            -{percentageDrop}%
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedVouchers.map((v) => (
            <Badge
              key={v.code}
              variant="outline"
              className="text-xs font-medium text-destructive border-destructive bg-foreground  flex items-center gap-1"
            >
              <TicketPercent size={12} /> {v.code}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  if (!data)
    return (
      <div className="w-full h-screen max-h-2/3 flex justify-center items-center">
        <Loading size={100} color="var(--primary)" />
      </div>
    );

  if (!selVariant) {
    return <Loading />;
  }

  return (
    <div className="w-[75%] flex flex-col justify-center items-start gap-2 mt-5">
      <div className="w-full flex flex-row justify-center items-start gap-2">
        <section className="w-[70%] flex flex-col justify-start items-start gap-2">
          <div className="w-full flex flex-row gap-2">
            {/* LEFT: IMAGES */}
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

            {/* CENTER: PRODUCT INFO */}
            <div className="w-[60%] flex flex-col gap-4">
              <div className="relative bg-background-secondary rounded-lg p-3 flex flex-col justify-start items-start">
                {/* Promo Banners */}
                <div className="flex gap-2 mb-2">
                  <Badge variant="secondary">
                    <div className=" flex flex-row items-center text-center">
                      <HiMiniCheckBadge className="mr-1" /> Official
                    </div>
                  </Badge>
                </div>

                <div className="text-xl font-medium text-text mt-1">
                  {data.title}
                </div>

                {/* Ratings */}
                <div className="flex flex-row justify-start items-center gap-2 text-text text-sm mt-2">
                  <span className="font-bold border-b border-primary text-primary">
                    {data.ratingAvg}
                  </span>
                  <RatingStars value={data.ratingAvg} />
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-muted-foreground">
                    ({data.ratingCount} đánh giá)
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-text">
                    {t('t_sold')} {data.soldCount}
                  </span>
                </div>

                {/* --- PRICE SECTION --- */}
                <div className="w-full mt-4 mb-2">{renderPriceSection()}</div>

                {/* Variants */}
                <div className="mt-2 w-full">
                  <p className="font-semibold text-text mb-2">
                    {t('t_variant_type')}
                  </p>
                  <div className="flex flex-row flex-wrap gap-2">
                    {data.variants.map((value, index) => (
                      <button
                        key={index}
                        className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all duration-200 
                          ${
                            selVariant.id === value.id
                              ? 'border-primary bg-primary/5 text-primary shadow-sm'
                              : 'border-input hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        onClick={() =>
                          handleSelectVariant(
                            value.id,
                            value.name,
                            value.price,
                            1,
                            value.image
                          )
                        }
                      >
                        {value.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
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

              {/* --- VOUCHER SELECTOR --- */}
              {data.shop && (
                <div className="bg-background-secondary rounded-lg">
                  <VoucherSelector
                    shopId={data.shop.id}
                    productId={data.id}
                    currentPrice={currentVariantPrice}
                    selectedVouchers={selectedVouchers}
                    onApply={setSelectedVouchers}
                  />
                </div>
              )}

              {/* Related/Top Deals */}
              <TopDealItems
                data={RecommendProduct}
                title={'Sản phẩm liên quan'}
                icon={<GitCompare />}
                size="3"
                limitItem={12}
                showRating={false}
                showFooter={false}
              />

              {/* Product Description */}
              <Desc data={data.description} />
            </div>
          </div>

          {/* Reviews Section */}
          <Suspense fallback={<Loading size={40} />}>
            <ReviewsServer
              key={data.id}
              id={data.id}
              ratingAvg={data.ratingAvg}
              ratingCount={data.ratingCount}
            />
          </Suspense>
        </section>

        {/* RIGHT: CART & PAYMENT ACTIONS */}
        <section className="w-[30%] sticky top-3 h-fit">
          <div className="w-full bg-background-secondary rounded-lg p-4 flex flex-col gap-4 shadow-sm border border-border">
            {/* Shop Info */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full border overflow-hidden">
                <Link href={`/shop/${data.shop?.slug}`}>
                  <Image
                    src={data.shop?.logoUrl || logo}
                    fill
                    alt="shop-logo"
                    className="object-cover"
                  />
                </Link>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-sm text-foreground line-clamp-1">
                  {data.shop?.name || 'Shop Name'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-primary/10 text-primary px-1.5 py-0 h-5"
                  >
                    <HiMiniCheckBadge className="mr-0.5" /> OFFICIAL
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    | {data.shop?.ratingAvg} ★
                  </span>
                </div>
              </div>
            </div>
            <Separator />

            {/* Selection Summary */}
            <div className="flex flex-col gap-3">
              <div className="p-2.5 rounded-md bg-muted/40 text-center font-medium text-sm border border-dashed items-center justify-center flex flex-col gap-1">
                {selVariant?.name}
                <Image
                  className="rounded"
                  src={selVariant.image}
                  width={100}
                  height={100}
                  alt="product-image"
                />
              </div>

              {/* Quantity */}
              <div className="flex justify-between items-center">
                <p className="font-medium text-sm text-muted-foreground">
                  {t('t_quantity')}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={handleMinus}
                    disabled={selVariant.amount <= 1}
                  >
                    <FaMinus size={10} />
                  </Button>
                  <span className="w-6 text-center font-bold text-sm">
                    {selVariant.amount}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={handlePlus}
                  >
                    <FaPlus size={10} />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Total Price */}
              <div className="flex justify-between items-end">
                <p className="font-bold text-sm">{t('t_total')}</p>
                <div className="flex flex-col items-end">
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(priceDetails.final * selVariant.amount, {
                      currency: c('t_currency'),
                      rate: Number(c('t_rate')),
                    })}
                  </p>
                  {priceDetails.discountAmount > 0 && (
                    <span className="text-xs text-success font-medium">
                      Saved:{' '}
                      {formatPrice(
                        priceDetails.discountAmount * selVariant.amount
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2.5 w-full mt-2">
              <Button
                size="lg"
                className="w-full bg-destructive hover:bg-destructive/80 cursor-pointer  font-bold shadow-md shadow-red-200"
                onClick={() =>
                  buyNow({
                    variantId: selVariant.id,
                    productId: data.id,
                    quantity: selVariant.amount,
                  })
                }
              >
                {t('t_buy_action')}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full border-primary text-primary hover:bg-primary/5"
                onClick={() =>
                  addProductToCart({
                    variantId: selVariant.id,
                    quantity: selVariant.amount,
                    priceSnap: new Decimal(selVariant.price),
                    currency: 'VND',
                  })
                }
              >
                {t('t_add_action')}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs h-9 border text-muted-foreground"
              >
                {t('t_pay_later')}
              </Button>
              {isLoggedIn && data.shop && (
                <div className="col-span-2">
                  <ChatButton shopId={data.shop.id} product={{ id: data.id }} />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="w-full mt-10">
        <SuggestDealToday />
      </div>
    </div>
  );
};

export default DetailPage;
