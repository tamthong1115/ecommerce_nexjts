import { useQuery } from '@tanstack/react-query';
import { fetchProductById } from '@/funcs/fetch';
import { productDetailType } from '@/types/public.data-types';

export const PRODUCT_KEYS = {
  detail: (id: string) => ['product', 'detail', id] as const,
};

export function useProductData(id: string) {
  return useQuery<productDetailType>({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => fetchProductById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}
