import { $Enums } from '@prisma/client';
import VoucherType = $Enums.VoucherType;

export interface SellerProductListItem {
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
}

export interface SearchProduct {
  id: string;
  title: string;
  description: string | null;
  minPrice: string;
  maxPrice: string;
  currency: string;
  ratingAvg: number;
  ratingCount: number;
  origin: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  shop: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  category: {
    id: string;
    name: string;
  } | null;
  voucher: {
    type: VoucherType;
    value: number;
    maxDiscount: number;
  } | null;
}

export interface SearchFilters {
  query: string;
  ai?: boolean;
  category?: string;
  shopId?: string;
  minPrice?: string;
  maxPrice?: string;
  titleOnly?: boolean;
  sortBy: 'createdAt' | 'price' | 'rating' | 'name';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}
