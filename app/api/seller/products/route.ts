import {
  createProductRoute,
  getProductsRoute,
} from '@/features/product/server/controller/product.route';

export const GET = getProductsRoute;

export const POST = createProductRoute;
