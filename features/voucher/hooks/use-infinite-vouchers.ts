import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/client-fetch';
import { VoucherResponseData } from '@/features/voucher/types/voucher.dto';
import { VoucherFetchScope } from '@/features/voucher/hooks/voucher.client';

interface UseInfiniteVouchersProps {
  scope?: VoucherFetchScope;
  limit?: number;
  search?: string;
  type?: string;
  shopId?: string;
  productId?: string;
  isActive?: boolean;
}

export function useInfiniteVouchers({
  scope = 'public',
  limit = 10,
  search,
  type,
  shopId,
  productId,
  isActive,
}: UseInfiniteVouchersProps) {
  return useInfiniteQuery({
    queryKey: [
      'vouchers',
      'infinite',
      {
        scope,
        limit,
        search,
        type,
        shopId,
        productId,
        isActive,
      },
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const urlSearchParams = new URLSearchParams();
      urlSearchParams.append('page', pageParam.toString());
      urlSearchParams.append('limit', limit.toString());
      if (search) urlSearchParams.append('search', search);
      if (type) urlSearchParams.append('type', type);
      if (shopId) urlSearchParams.append('shopId', shopId);
      if (productId) urlSearchParams.append('productId', productId);
      if (isActive !== undefined)
        urlSearchParams.append('isActive', String(isActive));

      const res = await fetchApi<VoucherResponseData>(
        `/api/vouchers?${urlSearchParams.toString()}`
      );
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !lastPage.pagination) {
        return undefined;
      }

      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}
