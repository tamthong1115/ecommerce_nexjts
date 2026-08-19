import { useQuery } from '@tanstack/react-query';
import { productApi } from '../client/product.api';
export const PRODUCT_KEYS = {
  all: ['seller-products'] as const,
};
export function useSellerProducts() {
  return useQuery({
    queryKey: PRODUCT_KEYS.all,
    queryFn: productApi.getSellerProducts,
  });
}