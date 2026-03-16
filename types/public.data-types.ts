import { VoucherDTO } from '@/features/voucher/types/voucher.dto';
import { $Enums } from '@/lib/generated/prisma';

export interface productDataResponse {
  data: productItemType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface productItemType {
  id: string;
  imageUrl: string;
  title: string;
  minPrice: number;
  ratingAvg: string;
  ratingCount: number;
  description: string;
  voucher: {
    maxDiscount: number;
    type: string;
    value: number;
  } | null;
  origin: string;
}

export interface productDetailType {
  VoucherProduct: VoucherDTO[];
  attributes: string | null;
  description: string;
  id: string;
  title: string;
  soldCount: string;
  images: {
    url: string;
    alt: string;
  }[];
  maxPrice: string;
  minPrice: string;
  ratingCount: 0;
  ratingAvg: 0;
  shop: {
    id: string;
    logoUrl: string;
    name: string;
    ratingAvg: string;
    ratingCount: number;
    slug: string;
  };
  variants: {
    attributes: string | null;
    id: string;
    image: string;
    price: string;
    productId: string;
    sku: string;
    stock: number;
    name: string;
  }[];
}

export interface reviewDataResponse {
  data: {
    reviews: reviewsItemType[];
    summary: {
      allImages: {
        url: string;
      }[];
      ratingBreakdown: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
      };
      totalImages: number;
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface reviewsItemType {
  body: string;
  createdAt: string;
  id: string;
  likes: number;
  rating: number;
  title: string;
  images: JSON | null;
  user: {
    id: string;
    image: string;
    name: string;
  };
}

export interface shopData {
  id: string;
  name: string;
  logoUrl: string;
  coverUrl: string;
  description: string | null;
  followerCount: number;
  ratingAvg: string;
  ratingCount: number;
}
