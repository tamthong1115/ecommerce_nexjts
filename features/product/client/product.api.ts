import { fetchApi } from '@/lib/client-fetch';
import { SellerProductListItem } from '@/types/product.data-types';

export const productApi = {
  getSellerProducts: async () => {
    const res = await fetchApi<SellerProductListItem[]>('/api/seller/products');
    if (!res.success) throw new Error(res.message || 'Failed to fetch products');
    return res.data || [];
  },
};
