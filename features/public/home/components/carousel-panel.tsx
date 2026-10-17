'use client';

import * as React from 'react';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';

import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Link from 'next/link';

const BANNER_COUNT = 6;

export const CarouselPanel = () => {
  const bannerImages = Array.from({ length: BANNER_COUNT }).map(
    (_, index) => `/banners/banner-${index + 1}.webp`
  );

  return (
    <div className="w-full bg-background-secondary rounded-xl pl-4 pr-4 shadow-sm">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
          duration: 10,
          dragFree: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: true,
          }),
        ]}
        className="w-full group relative"
      >
        <CarouselContent className="-ml-4">
          {bannerImages.map((imagePath, index) => (
            <CarouselItem key={index} className="pl-4 basis-full md:basis-1/2">
              <Card className="border-0 shadow-none bg-transparent rounded-xl">
                <CardContent className="flex items-center justify-center p-4 aspect-2/1 relative overflow-hidden rounded-xl z-1">
                  <Link href="/search" className="rounded-xl">
                    <Image
                      src={imagePath}
                      alt={`Banner ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-200 ease-out cursor-pointer rounded-xl z-0 "
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={index === 0}
                    />
                  </Link>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10
                     bg-background-secondary/80 hover:bg-background-secondary border-none shadow-md
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300 -ml-2"
        />
        <CarouselNext
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10
                     bg-background-secondary/80 hover:bg-background-secondary border-none shadow-md
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300 -mr-2"
        />
      </Carousel>
    </div>
  );
};
