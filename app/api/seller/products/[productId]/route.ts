import {
  getProductByIdByShopRoute,
  updateProductRoute,
} from '@/features/product/server/controller/product.route';

export const GET = getProductByIdByShopRoute;

export const PUT = updateProductRoute;
