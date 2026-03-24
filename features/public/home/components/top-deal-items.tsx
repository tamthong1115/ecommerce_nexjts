'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import { AiFillLike } from 'react-icons/ai';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ProductItem } from '../../components/product-item';
import { productRecommendDto } from '@/features/recommend_system/recommend.dto';
import { ProductRecommendationItem } from '@/components/custom/product-recommendation-uI';
import { Sparkles } from 'lucide-react';
import React from 'react';

type TopDealItemsProps = {
  data: productRecommendDto[];
  title?: string;
  icon?: React.ReactNode;
  color?: string;
  size: string;
  limitItem?: number;
  showDesc?: boolean;
  showRating?: boolean;
  showFooter?: boolean;
};

const basisClasses = {
  '1': 'lg:basis-full',
  '2': 'lg:basis-1/2',
  '3': 'lg:basis-1/3',
  '4': 'lg:basis-1/4',
  '5': 'lg:basis-1/5',
  '6': 'lg:basis-1/6',
};

export const TopDealItems = ({
  data,
  title,
  icon,
  size,
  color,
  showDesc = true,
  showRating,
  showFooter,
}: TopDealItemsProps) => {
  const t = useTranslations('home_layout.top_deal_items');
  const basisClass =
    basisClasses[size as keyof typeof basisClasses] || 'lg:basis-1/4';

  // --- SKELETON LOADING STATE ---
  if (!data) {
    return (
      <div className="w-full flex flex-col justify-start items-start gap-1 p-2 bg-background-secondary rounded-lg">
        {/* Header Skeleton */}
        <div className="w-full flex flex-row justify-between items-center p-2 mb-2">
          <div className="flex flex-row gap-2 items-center">
            <Skeleton className="h-6 w-6 rounded-full" /> {/* Icon */}
            <Skeleton className="h-7 w-40 rounded-md" /> {/* Title */}
          </div>
          <Skeleton className="h-5 w-24 rounded-md" /> {/* Watch More */}
        </div>

        {/* Carousel Items Skeleton */}
        <div className="w-full px-2 overflow-hidden">
          <div className="flex -ml-2 md:-ml-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`pl-2 md:pl-4 basis-1/2 md:basis-1/3 ${basisClass} shrink-0`}
              >
                <div className="flex flex-col space-y-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-5 w-[40%] mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- ACTUAL CONTENT ---
  return (
    <div className="w-full flex flex-col justify-start items-start gap-1 p-2 bg-background-secondary rounded-lg">
      <div className="w-full flex flex-row justify-between items-center p-2 mb-2">
        <p
          className={`w-fit flex flex-row gap-2 font-bold text-lg select-none items-center ${color ? color : 'text-error'}`}
        >
          {icon ? icon : <AiFillLike color="red" size={20} />}
          {title ? title : t('title')}
        </p>
        <Link
          href="/search"
          className={` ${color ? color : 'text-primary'}  hover:cursor-pointer`}
        >
          {t('watch_more')}
        </Link>
      </div>

      <Carousel
        opts={{ align: 'start', loop: true }}
        plugins={[Autoplay({ delay: 4000 })]}
        className="w-full px-2"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {data.map((item: productRecommendDto) => (
            <CarouselItem
              key={item.id}
              className={`pl-2 md:pl-4 basis-1/2 md:basis-1/3 ${basisClass}`}
            >
              <div className="h-full">
                <ProductRecommendationItem
                  item={item}
                  badgeText="Sản phẩm hot"
                  showDesc={showDesc}
                  isNew={true}
                  showRating={showRating}
                  showFooter={showFooter}
                  soldCount={item.soldCount}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 -ml-2" />
        <CarouselNext className="right-0 -mr-2" />
      </Carousel>
    </div>
  );
};
