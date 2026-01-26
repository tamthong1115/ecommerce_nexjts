'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchData } from '@/funcs/fetch';
import { paths } from '@/lib/path';
import { Separator } from '@/components/ui/separator';
import { IoIosArrowUp } from 'react-icons/io';
import { DrawerDetailsViewer } from '@/features/shared/components/table/drawer-details-viewer';

type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  price: string;
  image: string;
  currency: string;
  stock: number;
  reserved: number;
  attributes: any;
  createdAt: string;
  updatedAt: string;
};

type ProductDetail = {
  id: string;
  title: string;
  slug: string;
  origin: string;
  description: string;
  status: string;
  visibility: string;
  attributes: any;
  minPrice: string;
  maxPrice: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    name: string;
    logoUrl: string;
  };
  images: {
    url: string;
    alt: string;
  }[];
  variants: ProductVariant[];
};

type SellerProductListItem = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  images: {
    url: string;
    alt?: string | null;
  }[];
};

export function TableCellViewerSellerProduct({
  item,
}: {
  item: SellerProductListItem;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex !== null) {
      const timer = setTimeout(() => {
        const container = scrollContainerRef.current;
        const element = document.getElementById(`variant-item-${openIndex}`);

        if (container && element) {
          const scrollToPosition = element.offsetTop - container.offsetTop;
          container.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth',
          });
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [openIndex]);

  async function fetchDetail() {
    try {
      const response = await fetchData({
        baseUrl: paths.manager.product.fetch_detail,
        params: { id: item.id },
        setData: undefined,
      });
      if (response) {
        setDetail(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const renderVariant = (index: number, value: ProductVariant) => {
    const availableStock = value.stock - (value.reserved || 0);
    const isLowStock = availableStock <= 10;

    return (
      <div
        className={`w-full flex flex-col gap-4 
      ${openIndex === index ? 'max-h-[500px]' : 'max-h-0'}
      transition-[max-height] duration-300 ease-in-out
      overflow-hidden`}
        key={index}
      >
        <div className="w-full flex justify-center items-center">
          <Image
            src={value.image}
            alt={value.name}
            width={0}
            height={0}
            sizes="50vw"
            className="w-[50%]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="name">Variant Name</Label>
            <div className="w-full">{value.name}</div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="sku">SKU</Label>
            <div className="w-full">{value.sku}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="price">Price</Label>
            <div>
              {Number(value.price).toLocaleString()} {value.currency}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="stock">Stock</Label>
            <div className="flex items-center gap-2">
              <Badge variant={isLowStock ? 'destructive' : 'default'}>
                {availableStock} available
              </Badge>
              {value.reserved > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({value.reserved} reserved)
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />
      </div>
    );
  };

  const trigger = (
    <Button
      variant="link"
      className="text-foreground w-fit px-0 text-left"
      onClick={() => fetchDetail()}
    >
      {item.title}
    </Button>
  );

  const footerAction = (
    <Button onClick={() => router.push(`/seller/products/${item.id}/edit`)}>
      Edit Product
    </Button>
  );

  return (
    <DrawerDetailsViewer
      title={detail?.title || 'Loading...'}
      description="Product Details"
      trigger={trigger}
      footerAction={footerAction}
      contentRef={scrollContainerRef}
    >
      <div className="w-full flex justify-center items-center">
        <Carousel className="w-[70%] max-w-lg">
          <CarouselContent>
            {detail?.images?.map((img, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card className="w-full h-64 overflow-hidden">
                    <CardContent className="relative w-full h-full p-0">
                      <Image
                        src={img.url}
                        alt={img.alt || `Product image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 500px"
                        priority={index === 0}
                      />
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Shop</Label>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={detail?.shop.logoUrl} alt="shopLogo" />
            <AvatarFallback>UK</AvatarFallback>
          </Avatar>
          <span>{detail?.shop.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label>Status</Label>
          <Badge variant="outline">{detail?.status}</Badge>
        </div>
        <div className="flex flex-col gap-3">
          <Label>Visibility</Label>
          <Badge variant="secondary">{detail?.visibility}</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Slug</Label>
        <p className="text-muted-foreground">{detail?.slug}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Description</Label>
        <textarea
          defaultValue={detail?.description || ''}
          disabled
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="variants-list">
          Variants ({detail?.variants?.length || 0})
        </Label>
        <div className="flex flex-col gap-4">
          <ul className="w-full flex flex-col gap-2">
            {detail?.variants.map((value, index) => (
              <li
                key={value.id}
                id={`variant-item-${index}`}
                className="flex flex-col gap-2"
              >
                <div className="w-full flex flex-row justify-between items-center">
                  <div className="flex flex-row justify-start items-center gap-2">
                    <p>
                      {index + 1}
                      {'. '}
                    </p>
                    <p>{value.name}</p>
                    <Badge
                      variant={
                        value.stock - (value.reserved || 0) <= 10
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {value.stock - (value.reserved || 0)} in stock
                    </Badge>
                  </div>
                  <Button
                    variant={'outline'}
                    onClick={() =>
                      setOpenIndex(openIndex !== index ? index : null)
                    }
                    type="button"
                  >
                    <div
                      className={`${
                        openIndex !== index
                          ? `transform-[rotate(180deg)]`
                          : `transform-[rotate(0deg)]`
                      } transition ease-in-out`}
                    >
                      <IoIosArrowUp />
                    </div>
                  </Button>
                </div>

                {renderVariant(index, value)}
                <Separator />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DrawerDetailsViewer>
  );
}
