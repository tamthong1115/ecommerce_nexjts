import { Prisma } from '@/lib/generated/prisma';

export interface AddToCartRequest {
  variantId: string;
  quantity: number;
  priceSnap: Prisma.Decimal;
  currency: 'VND';
}

export interface UpdateCartRequest {
  items: {
    variant: { id: string };
    quantity: number;
  }[];
}

export type CartType = {
  id: string;
  userId: string;
  items: CartItem[];
};

export type CartItem = {
  id: string;
  quantity: number;
  priceSnap: number;
  variant: Variant;
};

export type Variant = {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAt: number | null;
  stock: number;
  productId: string; // Added productId as it was used in the page
  product: Product;
};

export type Product = {
  id: string; // Added id
  title: string;
  slug: string;
  images: ProductImage[];
  alt?: string; // Added alt
};

export type ProductImage = {
  url: string;
  alt: string;
  position: number;
};
