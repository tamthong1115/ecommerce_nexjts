'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HiMiniCheckBadge } from 'react-icons/hi2';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo.jpg';

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    logoUrl: string;
    slug: string;
    ratingAvg: string;
  };
}

export function ShopCard({ shop }: ShopCardProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full border overflow-hidden">
          <Link href={`/shop/${shop.slug}`}>
            <Image
              src={shop.logoUrl || logo}
              fill
              alt="shop-logo"
              className="object-cover"
            />
          </Link>
        </div>
        <div className="flex flex-col">
          <p className="font-semibold text-sm text-foreground line-clamp-1">
            {shop.name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Badge
              variant="secondary"
              className="text-[10px] bg-primary/10 text-primary px-1.5 py-0 h-5"
            >
              <HiMiniCheckBadge className="mr-0.5" /> OFFICIAL
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              | {shop.ratingAvg} ★
            </span>
          </div>
        </div>
      </div>
      <Separator />
    </>
  );
}
